create schema if not exists browser;

create table browser.profiles (
  id uuid not null primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamp with time zone default now()
);

alter table browser.profiles enable row level security;

-- Policies
create policy "Enable read access for all users"
on browser.profiles
for select
to anon, authenticated
using (true);

create policy "Users can insert their own profile"
on browser.profiles
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = id));

create policy "Users can update their own profile"
on browser.profiles
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));
