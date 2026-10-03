import test from 'node:test';
import assert from 'node:assert/strict';
import { localProcessEnvironment, validateLocalConnection, runLocalCLI } from '../scripts/local-runtime.mjs';

const connection={DB_URL:'postgresql://postgres:postgres@127.0.0.1:54322/postgres',API_URL:'http://127.0.0.1:54321',PUBLISHABLE_KEY:'sb_publishable_example'};
test('destructive test tools reject remote databases and disguised connection URLs',()=>{
  assert.equal(validateLocalConnection(connection).apiUrl,connection.API_URL);
  for(const DB_URL of ['postgresql://postgres:postgres@remote.example:5432/postgres','postgresql://postgres:postgres@127.0.0.1:5432/production','postgresql://postgres:postgres@127.0.0.1:5432/postgres?host=remote.example','postgresql://other:postgres@127.0.0.1:5432/postgres']) {
    assert.throws(()=>validateLocalConnection({...connection,DB_URL}));
  }
  assert.throws(()=>validateLocalConnection({...connection,API_URL:'https://example.supabase.co'}));
});
test('local processes do not inherit cloud targets or a substituted CLI binary',()=>{
  const env=localProcessEnvironment({PATH:'/bin',SUPABASE_PROJECT_ID:'live',SUPABASE_ACCESS_TOKEN:'secret',SUPABASE_CLI_BINARY_OVERRIDE:'/bad',PGHOST:'remote',DATABASE_URL:'remote'});
  assert.equal(env.PATH,'/bin');
  for(const key of ['SUPABASE_PROJECT_ID','SUPABASE_ACCESS_TOKEN','SUPABASE_CLI_BINARY_OVERRIDE','PGHOST','DATABASE_URL']) assert.equal(env[key],undefined);
  assert.ok(env.SUPABASE_HOME.endsWith('.local/supabase'));
});
test('runner refuses remote/reset flags and arbitrary working directories before executing',async()=>{
  for(const args of [['link'],['db','push'],['db','reset'],['db','reset','--local','--linked'],['migration','up','--local','--db-url=postgres://remote']]) {
    await assert.rejects(runLocalCLI(args));
  }
  await assert.rejects(runLocalCLI(['start'],'/tmp/other-project'));
});
