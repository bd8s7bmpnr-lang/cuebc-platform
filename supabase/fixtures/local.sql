-- Fictional fixtures only. This is intentionally NOT supabase/seed.sql.
-- Applied by the local runner only after validating its loopback endpoint.
begin;
insert into public.organizations(id,slug,name) values
('10000000-0000-4000-8000-000000000001','cuebc-local','CUEBC fictional test organization') on conflict do nothing;
insert into public.conferences(id,organization_id,slug,title,event_date,capacity) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','local-test','Fictional local conference','2030-10-25',100) on conflict do nothing;
insert into public.rooms(id,conference_id,name,capacity) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Test room',25) on conflict do nothing;
insert into public.time_blocks(id,conference_id,label,starts_at,ends_at) values
('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Test session','2030-10-25T10:00:00-07:00','2030-10-25T11:00:00-07:00') on conflict do nothing;
insert into public.ticket_types(id,conference_id,category,attendance,amount_cents) values
('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','member','inperson',12500),
('50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','member','online',7500),
('50000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','nonmember','inperson',15000),
('50000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001','nonmember','online',10000),
('50000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000001','student','inperson',2500),
('50000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000001','student','online',2500) on conflict do nothing;
insert into public.presenters(id,conference_id,name) values
('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Fictional Presenter') on conflict do nothing;
insert into public.workshops(id,conference_id,title,presenter_id,room_id,time_block_id,format,capacity) values
('70000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Fictional workshop','60000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','inperson',25) on conflict do nothing;
commit;
