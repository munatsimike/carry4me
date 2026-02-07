create policy "traveler can create carry requests"
on public.carry_requests
for insert
to authenticated
with check (traveler_user_id = auth.uid());
