-- Gives Artisans an actual transaction to base a commission on. Until now
-- artisans.products was browse-only, driving a direct phone/WhatsApp
-- contact with no order recorded anywhere (see 20260910240000's own
-- comment: "showcase, not marketplace"). This adds a lightweight
-- order/quote request: the customer submits a request for a product at
-- its listed price and a quantity, the artisan (agency owner) then
-- confirms or declines it from their dashboard - a real craft order can
-- vary (stock, custom sizing, lead time), so confirmation is a deliberate
-- artisan action, unlike a restaurant table slot which is confirmed the
-- instant it's booked.
--
-- NOTE: like the other recent migrations in this folder, the Supabase CLI
-- direct-connection path is broken for this project - run this file
-- manually in the Supabase Dashboard SQL Editor.

CREATE TABLE IF NOT EXISTS public.artisan_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 100),
  total_amount NUMERIC GENERATED ALWAYS AS (unit_price * quantity) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artisan_orders_artisan_id ON public.artisan_orders(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_orders_user_id ON public.artisan_orders(user_id);

ALTER TABLE public.artisan_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own artisan orders" ON public.artisan_orders;
CREATE POLICY "Users can create their own artisan orders"
  ON public.artisan_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and artisan owners view relevant orders" ON public.artisan_orders;
CREATE POLICY "Users and artisan owners view relevant orders"
  ON public.artisan_orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.artisans ar
      WHERE ar.id = artisan_id AND public.is_agency_owner(auth.uid(), ar.agency_id)
    )
  );

-- Only the artisan (agency owner) or an admin confirms/declines an order -
-- the customer who placed it cannot self-confirm their own purchase.
DROP POLICY IF EXISTS "Artisan owners manage their orders" ON public.artisan_orders;
CREATE POLICY "Artisan owners manage their orders"
  ON public.artisan_orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.artisans ar
    WHERE ar.id = artisan_id AND public.is_agency_owner(auth.uid(), ar.agency_id)
  ));

DROP POLICY IF EXISTS "Admins manage all artisan orders" ON public.artisan_orders;
CREATE POLICY "Admins manage all artisan orders"
  ON public.artisan_orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS set_updated_at_artisan_orders ON public.artisan_orders;
CREATE TRIGGER set_updated_at_artisan_orders
  BEFORE UPDATE ON public.artisan_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Extend the shared commissions ledger (see 20260917020000) with this
-- third origin.
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_source_type_check;
ALTER TABLE public.commissions ADD CONSTRAINT commissions_source_type_check
  CHECK (source_type IN ('service_booking', 'restaurant_reservation', 'wellness_booking', 'artisan_order'));

CREATE OR REPLACE FUNCTION public.sync_artisan_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id UUID;
  v_rate NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT ar.agency_id, a.commission_rate
      INTO v_agency_id, v_rate
      FROM public.artisans ar
      JOIN public.agencies a ON a.id = ar.agency_id
      WHERE ar.id = NEW.artisan_id;

    IF v_rate IS NULL THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.commissions (agency_id, source_type, source_id, booking_amount, commission_rate, commission_amount, status)
    VALUES (v_agency_id, 'artisan_order', NEW.id, NEW.total_amount, v_rate, ROUND(NEW.total_amount * v_rate / 100, 2), 'pending')
    ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO UPDATE
      SET booking_amount = EXCLUDED.booking_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          updated_at = now()
      WHERE public.commissions.status = 'pending';

  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE source_type = 'artisan_order' AND source_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_artisan_order_commission_trigger ON public.artisan_orders;
CREATE TRIGGER sync_artisan_order_commission_trigger
  AFTER INSERT OR UPDATE ON public.artisan_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_artisan_order_commission();
