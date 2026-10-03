import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';
import { createHash } from 'node:crypto';
import { root, localDirectory, prepareWorkspace, runLocalCLI, localConnection } from './local-runtime.mjs';
import { createBackendClient } from '../docs/app/data.js';

const command=process.argv[2];
const runtime=process.env.CUEBC_LOCAL_RUNTIME || 'native';
if(!['native','docker','podman'].includes(runtime)) throw Error('Unsupported local runtime.');

async function withDatabase(connection, callback) {
  const client=new Client({connectionString:connection.databaseUrl,connectionTimeoutMillis:10000});
  await client.connect();
  try { return await callback(client); } finally { await client.end(); }
}
async function health(connection) {
  const client=createBackendClient({mode:'local',supabaseUrl:connection.apiUrl,publishableKey:connection.publishableKey});
  return client.health();
}
async function start(workspace) {
  console.log('Starting the isolated local backend; the first run downloads verified service binaries.');
  await runLocalCLI(['start','--runtime',runtime,'--eager','--exclude','studio,storage,realtime,functions,analytics,pooler','--output-format','json'],workspace);
  await runLocalCLI(['migration','up','--local'],workspace);
  return localConnection(workspace);
}

try {
  if(command==='start') {
    const workspace=await prepareWorkspace('development');
    const connection=await start(workspace);
    await withDatabase(connection,async client=>client.query(await readFile(path.join(root,'supabase/fixtures/local.sql'),'utf8')));
    const status=await health(connection);
    console.log(`Local backend ready: ${connection.apiUrl}; schema ${status.schema_version}. Fictional fixtures installed.`);
  } else if(command==='status') {
    const connection=await localConnection();
    const status=await health(connection);
    console.log(`Local backend healthy: ${connection.apiUrl}; schema ${status.schema_version}.`);
  } else if(command==='stop') {
    await runLocalCLI(['stop']); console.log('Local backend stopped; its database is preserved.');
  } else if(command==='verify') {
    const workspace=await prepareWorkspace('verification');
    const devConnection=process.env.CUEBC_VERIFY_DEV_ISOLATION==='1' ? await localConnection() : null;
    const developmentBefore=devConnection ? await fingerprint(devConnection) : null;
    let started=false;
    const results=[];
    try {
      const connection=await start(workspace); started=true;
      const { verifyDatabase }=await import('../tests/backend/database.mjs');
      for(let pass=1;pass<=2;pass++) {
        console.log(`Clean installation verification ${pass}/2 (verification workspace only).`);
        await runLocalCLI(['db','reset','--local','--no-seed'],workspace);
        results.push(await withDatabase(connection,client=>verifyDatabase(client,{pass})));
        // The REST schema cache reloads asynchronously after reset.
        let result;
        for(let attempt=0;attempt<10;attempt++) {
          try { result=await health(connection); break; } catch(error) {
            if(attempt===9) throw error;
            await new Promise(resolve=>setTimeout(resolve,1000));
          }
        }
        results.at(-1).apiHealth=result;
        results.at(-1).anonymousRead=await verifyAnonymousAccess(connection);
      }
      if(devConnection) {
        if(devConnection.databaseUrl===connection.databaseUrl) throw Error('Development and verification must have different databases.');
        if(developmentBefore!==await fingerprint(devConnection)) throw Error('Verification changed development data.');
      }
      await writeFile(path.join(localDirectory,'verification-result.json'),JSON.stringify({verifiedAt:new Date().toISOString(),runtime,developmentIsolation:devConnection?'verified':'not exercised',results},null,2));
      console.log('Two clean installations, database invariants, fixture repeatability, and API access checks passed.');
    } finally {
      if(started) await runLocalCLI(['stop'],workspace);
    }
  } else {
    throw Error('Use start, status, stop, or verify. Verification rebuilds only its separate local test database.');
  }
} catch(error) { console.error(error.message); process.exitCode=1; }

async function verifyAnonymousAccess(connection) {
  for(const table of ['organizations','profiles','organization_memberships','conferences','rooms','time_blocks','ticket_types','presenters','workshops']) {
    const response=await fetch(`${connection.apiUrl}/rest/v1/${table}?select=*`,{headers:{apikey:connection.publishableKey},signal:AbortSignal.timeout(10000)});
    if(![401,403].includes(response.status)) throw Error(`Unexpected public access to ${table}: ${response.status}`);
  }
  return 'All 9 tables deny anonymous reads';
}

async function fingerprint(connection) {
  return withDatabase(connection,async client=>{
    const hash=createHash('sha256');
    for(const table of ['private.installation','public.organizations','public.conferences','public.ticket_types','public.rooms','public.time_blocks','public.presenters','public.workshops']) {
      const result=await client.query(`select row_to_json(t)::text as record from ${table} t order by row_to_json(t)::text`);
      hash.update(JSON.stringify(result.rows));
    }
    return hash.digest('hex');
  });
}
