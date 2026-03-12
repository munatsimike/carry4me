CREATE OR REPLACE FUNCTION trip_has_available_capacity(
  p_trip_id uuid,
  p_required_weight numeric
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (capacity_kg - reserved_weight_kg - used_weight_kg) >= p_required_weight
  FROM trips
  WHERE id = p_trip_id;
$$;