-- RLS Policies for GovContractAI

-- 1. PROFILES TABLE
alter table profiles enable row level security;
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- 2. ORGANIZATIONS TABLE
alter table organizations enable row level security;
create policy "Users can view their own organizations" on organizations
  for select using (auth.uid() = user_id);
create policy "Users can insert their own organizations" on organizations
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own organizations" on organizations
  for update using (auth.uid() = user_id);
create policy "Users can delete their own organizations" on organizations
  for delete using (auth.uid() = user_id);

-- 3. OPPORTUNITIES TABLE
alter table opportunities enable row level security;


-- 4. APPLICATIONS TABLE
alter table applications enable row level security;
create policy "Users can view their own applications" on applications
  for select using (auth.uid() = user_id);
create policy "Users can insert their own applications" on applications
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own applications" on applications
  for update using (auth.uid() = user_id);
create policy "Users can delete their own applications" on applications
  for delete using (auth.uid() = user_id);

-- 5. NOTIFICATIONS TABLE
alter table notifications enable row level security;
create policy "Users can view their own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy "Users can insert their own notifications" on notifications
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own notifications" on notifications
  for update using (auth.uid() = user_id);
create policy "Users can delete their own notifications" on notifications
  for delete using (auth.uid() = user_id);

-- 6. RATE_LIMITS TABLE
alter table rate_limits enable row level security;
create policy "Anyone can insert rate limits" on rate_limits
  for insert with check (true);
create policy "Anyone can select rate limits" on rate_limits
  for select using (true);

-- 7. ERROR_LOGS TABLE
alter table error_logs enable row level security;
create policy "Anyone can insert error logs" on error_logs
  for insert with check (true);
create policy "Anyone can select error logs" on error_logs
  for select using (true); 