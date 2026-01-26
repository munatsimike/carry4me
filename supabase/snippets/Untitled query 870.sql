select column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'trips'
  and column_name = 'traveler_user_id';


