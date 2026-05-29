-- Point listing-match notifications at dashboard suggested matches with the right tab.

update public.listing_match_notification_templates
set link = '/dashboard?tab=trips#suggested-matches'
where type = 'MATCHING_TRIP_POSTED';

update public.listing_match_notification_templates
set link = '/dashboard?tab=parcels#suggested-matches'
where type = 'MATCHING_PARCEL_POSTED';
