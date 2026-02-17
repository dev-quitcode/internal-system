-- Allow authenticated users to read/assign academy pages

alter table public.academy_assignments enable row level security;

create policy "Authenticated can read academy assignments"
  on public.academy_assignments
  for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert academy assignments"
  on public.academy_assignments
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update academy assignments"
  on public.academy_assignments
  for update
  using (auth.role() = 'authenticated');

alter table public.academy_assignment_pages enable row level security;

create policy "Authenticated can read academy assignment pages"
  on public.academy_assignment_pages
  for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert academy assignment pages"
  on public.academy_assignment_pages
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update academy assignment pages"
  on public.academy_assignment_pages
  for update
  using (auth.role() = 'authenticated');
