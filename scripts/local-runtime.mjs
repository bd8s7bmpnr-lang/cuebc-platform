import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, readFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
const run = promisify(execFile);
const cli = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js');
export const localDirectory = path.join(root, '.local');

export function localProcessEnvironment(source = process.env) {
  // Do not let a cloud project, custom CLI binary, or inherited endpoint override a local command.
  const env = Object.fromEntries(Object.entries(source).filter(([key]) => !/^(SUPABASE_|PG|DATABASE_URL$)/.test(key)));
  return { ...env, SUPABASE_HOME:path.join(localDirectory,'supabase'), SUPABASE_EXPERIMENTAL_STACK:'1', DO_NOT_TRACK:'1' };
}

export function validateLocalConnection(values) {
  if (!values || typeof values !== 'object') throw Error('Missing local service configuration.');
  const database = new URL(values.DB_URL);
  const api = new URL(values.API_URL);
  if (database.protocol !== 'postgresql:' && database.protocol !== 'postgres:') throw Error('Invalid local database protocol.');
  for (const url of [database,api]) {
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') throw Error('Refusing a non-loopback backend.');
    if (!url.port || url.search || url.hash) throw Error('Local endpoints need explicit ports and no extra options.');
  }
  if (database.pathname !== '/postgres' || database.username !== 'postgres') throw Error('Unexpected local database identity.');
  if (api.protocol !== 'http:' || api.username || api.password || !['','/'].includes(api.pathname)) throw Error('Invalid local API origin.');
  if (!values.PUBLISHABLE_KEY && !values.ANON_KEY) throw Error('Missing local public API key.');
  return { databaseUrl: database.href, apiUrl:api.origin, publishableKey:values.PUBLISHABLE_KEY || values.ANON_KEY };
}

export async function prepareWorkspace(kind) {
  if (!['development','verification'].includes(kind)) throw Error('Unknown local workspace.');
  await mkdir(localDirectory, {recursive:true, mode:0o700});
  if (kind === 'development') return root;
  const workspace = path.join(localDirectory,'verification');
  await mkdir(path.join(workspace,'supabase'),{recursive:true});
  const config = await readFile(path.join(root,'supabase/config.toml'),'utf8');
  await writeFile(path.join(workspace,'supabase/config.toml'),config.replace('project_id = "cuebc-platform"','project_id = "cuebc-foundation-verification"'));
  await cp(path.join(root,'supabase/migrations'),path.join(workspace,'supabase/migrations'),{recursive:true});
  return workspace;
}

export async function runLocalCLI(args, workspace = root) {
  if (![root,path.join(localDirectory,'verification')].includes(workspace)) throw Error('Unknown local workspace.');
  // This wrapper deliberately has no link, push, deploy, or remote-reset command.
  const permitted = new Set(['start','stop','status','db reset','migration up']);
  const command = ['db','migration'].includes(args[0]) ? args.slice(0,2).join(' ') : args[0];
  if (!permitted.has(command) || args.some(x=>/^(--linked|--db-url|--project-ref|--workdir|--stack)/.test(x))) throw Error('Only guarded local commands are allowed.');
  if (['db reset','migration up'].includes(command) && !args.includes('--local')) throw Error('Database commands require --local.');
  await mkdir(localDirectory,{recursive:true,mode:0o700});
  try {
    const result=await run(process.execPath,[cli,...args],{cwd:workspace,env:localProcessEnvironment(),timeout:600000,maxBuffer:10*1024*1024});
    await writeFile(path.join(localDirectory,'last-cli.log'),result.stderr,{mode:0o600});
    return result.stdout;
  } catch(error) {
    // Full provider diagnostics stay in ignored local files, not terminal output or git.
    await writeFile(path.join(localDirectory,'last-cli.log'),String(error.stderr || error.message),{mode:0o600});
    throw Error(`Local Supabase ${command} failed. See .local/last-cli.log for diagnostics.`);
  }
}

export async function localConnection(workspace = root) {
  const raw=await runLocalCLI(['status','--env','--output-format','json'],workspace);
  return validateLocalConnection(JSON.parse(raw));
}
