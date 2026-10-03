import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function verifyDatabase(client,{pass}) {
  const tables=['organizations','profiles','organization_memberships','conferences','rooms','time_blocks','ticket_types','presenters','workshops'];
  const checks=[];
  const record=(text)=>checks.push(text);
  assert.equal((await client.query('select schema_version from private.installation')).rows[0].schema_version,1);
  for(const table of tables) assert.equal((await client.query(`select count(*)::int as n from public.${table}`)).rows[0].n,0);
  record('Clean migration contains no demo, attendee, or organization records');
  const fixture=await readFile(new URL('../../supabase/fixtures/local.sql',import.meta.url),'utf8');
  await client.query(fixture); await client.query(fixture);
  assert.equal((await client.query('select count(*)::int as n from public.ticket_types')).rows[0].n,6);
  assert.equal((await client.query('select count(*)::int as n from public.workshops')).rows[0].n,1);
  assert.equal((await client.query('select count(*)::int as n from public.profiles')).rows[0].n,0);
  record('Local fixtures can be applied twice without duplicates and create no auth users');
  const secured=await client.query("select relname,relrowsecurity,relforcerowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relname=any($1::text[])",[tables]);
  assert.equal(secured.rows.length,9);
  assert.ok(secured.rows.every(x=>x.relrowsecurity&&x.relforcerowsecurity));
  for(const role of ['anon','authenticated']) {
    for(const table of tables) {
      for(const privilege of ['SELECT','INSERT','UPDATE','DELETE']) {
        assert.equal((await client.query('select has_table_privilege($1,$2,$3) as allowed',[role,`public.${table}`,privilege])).rows[0].allowed,false);
      }
    }
    await client.query('begin');
    await client.query(`set local role ${role}`);
    assert.equal((await client.query('select public.backend_health() as value')).rows[0].value.service,'cuebc');
    try { await client.query('select * from public.conferences'); assert.fail('Unauthorized table read succeeded'); }
    catch(error) { assert.equal(error.code,'42501'); }
    await client.query('rollback');
    await client.query('begin');
    await client.query(`set local role ${role}`);
    try { await client.query('select * from private.installation'); assert.fail('Private schema read succeeded'); }
    catch(error) { assert.equal(error.code,'42501'); }
    await client.query('rollback');
  }
  record('All nine tables enforce RLS; anonymous/authenticated roles lack read/write grants; health remains callable');
  await client.query('begin');
  try {
    async function rejects(sql,code) {
      await client.query('savepoint invariant');
      try { await client.query(sql); assert.fail('Invalid data accepted'); }
      catch(error) { assert.equal(error.code,code); }
      finally { await client.query('rollback to savepoint invariant'); }
    }
    await rejects('update public.ticket_types set amount_cents=-1','23514');
    await rejects('update public.workshops set capacity=0','23514');
    await rejects("update public.conferences set currency='USD'",'23514');
    await rejects("update public.conferences set selection_mode='invalid'",'23514');
    await rejects('update public.time_blocks set ends_at=starts_at','23514');
    await rejects("update public.conferences set registration_opens_at='2030-10-25',registration_closes_at='2030-10-24'",'23514');
    await rejects("insert into public.organization_memberships(organization_id,user_id,role) values ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','owner')",'23514');
    await rejects("insert into public.ticket_types(conference_id,category,attendance,amount_cents) values ('20000000-0000-4000-8000-000000000001','member','inperson',100)",'23505');
    await client.query("insert into public.conferences(id,organization_id,slug,title,event_date,capacity) values ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','other','Other','2031-10-24',10)");
    await client.query("insert into public.rooms(id,conference_id,name,capacity) values ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Other room',10)");
    await rejects("update public.workshops set room_id='30000000-0000-4000-8000-000000000002'",'23503');
    record('Database rejects invalid money, capacity, date windows, enums, duplicate tickets, and cross-conference room assignments');
    await client.query('create table public.future_table_test(id integer)');
    await client.query("create function public.future_function_test() returns integer language sql as 'select 1'");
    for(const role of ['anon','authenticated']) {
      assert.equal((await client.query("select has_table_privilege($1,'public.future_table_test','SELECT') as allowed",[role])).rows[0].allowed,false);
      assert.equal((await client.query("select has_function_privilege($1,'public.future_function_test()','EXECUTE') as allowed",[role])).rows[0].allowed,false);
    }
    record('Future tables/functions do not receive unintended public permissions');
  } finally { await client.query('rollback'); }
  return {pass,checks};
}
