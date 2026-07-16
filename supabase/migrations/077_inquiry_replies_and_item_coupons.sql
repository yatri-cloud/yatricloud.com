-- 077: two admin upgrades.
--
-- 1. Inquiry replies — /admin/inquiries can now answer people by email and
--    the reply is recorded on the row (who was answered, when, with what).
--
-- 2. Per-item coupons — a coupon can stay universal ('all'), scope-wide
--    (training/event/store), or be pinned to ONE specific item. The pinned
--    item is matched at validation time, so a product-pinned code only works
--    when that product is actually in the checkout, and carts can apply the
--    discount to the matching line alone.

alter table consultation_requests
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz;

alter table contact_messages
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz;

alter table coupons
  add column if not exists entity_type text
    check (entity_type in ('event','training','product')),
  add column if not exists entity_id uuid,
  add column if not exists entity_label text;

-- Validation now accepts the checkout's item ids and returns the pin (if
-- any) so the client can target the discount. Backwards compatible: pinless
-- coupons behave exactly as before.
drop function if exists validate_coupon(text, text);
create or replace function validate_coupon(
  p_code text,
  p_scope text default 'all',
  p_entity_ids uuid[] default null
)
returns table (percent_off int, entity_id uuid)
language sql security definer set search_path = public stable
as $$
  select c.percent_off, c.entity_id
  from coupons c
  where upper(c.code) = upper(trim(p_code))
    and c.active
    and (c.applies_to = 'all' or c.applies_to = p_scope)
    and (c.expires_at is null or c.expires_at > now())
    and (c.max_uses is null or c.used_count < c.max_uses)
    and (
      c.entity_id is null
      or (p_entity_ids is not null and c.entity_id = any(p_entity_ids))
    );
$$;

revoke all on function validate_coupon(text, text, uuid[]) from public;
grant execute on function validate_coupon(text, text, uuid[]) to anon, authenticated;
