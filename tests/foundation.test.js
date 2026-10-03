import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvironment, environment } from '../docs/app/environment.js';
import { createBackendClient, createPreviewStore, PREVIEW_STORAGE_KEY } from '../docs/app/data.js';

const local = {mode:'local', supabaseUrl:'http://127.0.0.1:54321', publishableKey:'sb_publishable_local_test'};
const hosted = {mode:'production', supabaseUrl:'https://example.supabase.co', publishableKey:'sb_publishable_example'};
const jwt = role => `header.${Buffer.from(JSON.stringify({role})).toString('base64url')}.signature`;

test('public preview is explicitly offline and its environment is immutable', () => {
  assert.deepEqual(environment, {mode:'demo',supabaseUrl:'',publishableKey:''});
  assert.ok(Object.isFrozen(environment));
  assert.throws(()=>validateEnvironment({mode:'demo',supabaseUrl:hosted.supabaseUrl}), /must not connect/);
  assert.throws(()=>createBackendClient(environment), /cannot make backend requests/);
});

test('environment selection rejects accidental or secret-bearing configurations', () => {
  for (const mode of [undefined,'live','',null]) assert.throws(()=>validateEnvironment({mode}));
  for (const publishableKey of ['sk_live_bad','sb_secret_bad',jwt('service_role'),jwt('authenticated'),'invalid','']) {
    assert.throws(()=>validateEnvironment({...hosted,publishableKey}), /Only a Supabase/);
  }
  assert.throws(()=>validateEnvironment({...hosted,serviceRoleKey:'secret'}), /Unexpected/);
  assert.throws(()=>validateEnvironment({...hosted,supabaseUrl:'https://user:password@example.com'}), /without credentials/);
  assert.throws(()=>validateEnvironment({...hosted,supabaseUrl:'https://example.com/?key=secret'}), /plain backend/);
  assert.equal(validateEnvironment({...hosted,publishableKey:jwt('anon')}).mode,'production');
});

test('local and hosted backends cannot be confused', () => {
  assert.equal(validateEnvironment(local).supabaseUrl,local.supabaseUrl);
  assert.equal(validateEnvironment({...hosted,mode:'test'}).mode,'test');
  assert.throws(()=>validateEnvironment({...hosted,mode:'local'}), /loopback/);
  for(const mode of ['production','test']) assert.throws(()=>validateEnvironment({...local,mode}), /remote HTTPS/);
  assert.throws(()=>validateEnvironment({...hosted,supabaseUrl:'http://example.com'}), /HTTPS/);
});

test('existing preview data and its storage key survive the persistence boundary', () => {
  const values = new Map([[PREVIEW_STORAGE_KEY,JSON.stringify({version:1,conferences:[{id:'old'}],draft:{first:'Saved'}})]]);
  const storage = {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const store=createPreviewStore(environment,storage,()=>({version:1,seed:true}),1);
  assert.equal(store.load().draft.first,'Saved');
  const state=store.load(); state.draft.first='Updated'; store.save(state);
  assert.equal(store.load().draft.first,'Updated');
  assert.equal(store.key,'cuebc.frontend.v1');
  values.set(store.key,'bad json'); assert.equal(store.load().seed,true);
  values.set(store.key,JSON.stringify({version:0})); assert.equal(store.load().seed,true);
  assert.throws(()=>createPreviewStore(local,storage,()=>({}),1), /outside demo/);
});

test('blocked browser storage still allows a fresh demo and reports failed writes', () => {
  const store=createPreviewStore(environment,{getItem(){throw Error('blocked');},setItem(){throw Error('full');}},()=>({version:1}),1);
  assert.deepEqual(store.load(),{version:1});
  assert.throws(()=>store.save({version:1}), /full/);
});

test('backend compatibility probe uses the configured origin and reports incompatible or failed services', async () => {
  const client=createBackendClient(local,async(url,options)=>{
    assert.equal(url,local.supabaseUrl+'/rest/v1/rpc/backend_health');
    assert.equal(options.headers.apikey,local.publishableKey);
    assert.equal(options.method,'POST');
    return {ok:true,json:async()=>({service:'cuebc',schema_version:1})};
  });
  assert.equal((await client.health()).schema_version,1);
  await assert.rejects(createBackendClient(local,async()=>({ok:false,status:503})).health(), /503/);
  await assert.rejects(createBackendClient(local,async()=>({ok:true,json:async()=>({service:'other',schema_version:1})})).health(), /Unsupported/);
});
