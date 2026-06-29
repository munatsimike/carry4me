-- Format French profile phones with +33 in payment contact notifications.

create or replace function public.format_profile_phone_for_notification(
  p_phone text,
  p_country_code text
)
returns text
language plpgsql
immutable
as $$
declare
  v_trimmed text;
  v_digits text;
  v_dial text;
begin
  v_trimmed := nullif(trim(coalesce(p_phone, '')), '');
  if v_trimmed is null then
    return null;
  end if;

  if v_trimmed like '+%' then
    return v_trimmed;
  end if;

  v_digits := regexp_replace(v_trimmed, '\D', '', 'g');
  if v_digits = '' then
    return v_trimmed;
  end if;

  v_dial := case trim(coalesce(p_country_code, ''))
    when 'UK' then '+44'
    when 'GB' then '+44'
    when 'United Kingdom' then '+44'
    when 'USA' then '+1'
    when 'US' then '+1'
    when 'United States' then '+1'
    when 'United States of America' then '+1'
    when 'Zimbabwe' then '+263'
    when 'ZW' then '+263'
    when 'NL' then '+31'
    when 'Netherlands' then '+31'
    when 'FR' then '+33'
    when 'France' then '+33'
    else null
  end;

  if v_dial is null then
    return v_trimmed;
  end if;

  if v_digits like regexp_replace(v_dial, '\D', '', 'g') || '%' then
    return '+' || v_digits;
  end if;

  return v_dial || regexp_replace(v_digits, '^0+', '');
end;
$$;

revoke all on function public.format_profile_phone_for_notification(text, text) from public;
