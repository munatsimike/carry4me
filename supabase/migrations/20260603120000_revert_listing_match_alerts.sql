-- Revert all listing match alert migrations (start fresh).

drop trigger if exists listing_match_events_after_insert_notify on public.listing_match_events;
drop trigger if exists trip_accepted_categories_match_alerts on public.trip_accepted_categories;
drop trigger if exists parcel_categories_match_alerts on public.parcel_categories;
drop trigger if exists trips_after_insert_match_alerts on public.trips;
drop trigger if exists parcels_after_insert_match_alerts on public.parcels;

drop function if exists public.notify_on_listing_match_event();
drop function if exists public.notify_match_alerts_on_trip_category();
drop function if exists public.notify_match_alerts_on_parcel_category();
drop function if exists public.notify_subscribers_on_new_trip();
drop function if exists public.notify_subscribers_on_new_parcel();
drop function if exists public.emit_listing_match_alerts(text, uuid);
drop function if exists public.sync_listing_match_alert_subscriptions(uuid);
drop function if exists public.notify_match_alerts_for_trip(uuid);
drop function if exists public.notify_match_alerts_for_parcel(uuid);
drop function if exists public.deliver_listing_match_alert(uuid, uuid, boolean, text, text, uuid, uuid);
drop function if exists public.deliver_listing_match_alert(uuid, uuid, boolean, text, uuid, uuid);
drop function if exists public.list_match_alert_email_queue_for_listing(text, uuid);
drop function if exists public.set_listing_match_alerts(text, boolean, boolean);
drop function if exists public.has_listing_match_alerts(text);
drop function if exists public.listing_weight_fits(uuid, uuid);
drop function if exists public.listing_categories_match(uuid, uuid);
drop function if exists public.listing_countries_match(text, text, text, text);
drop function if exists public.canonical_listing_country(text);
drop function if exists public.listing_routes_match(text, text, text, text, text, text, text, text);
drop function if exists public.listing_dates_within_range(date, date, integer);

drop table if exists public.listing_match_events;
drop table if exists public.listing_match_notification_templates;
drop table if exists public.listing_match_alert_deliveries;
drop table if exists public.listing_match_alert_subscriptions;
