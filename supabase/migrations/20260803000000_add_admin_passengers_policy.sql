-- Admins need to see passenger details from the admin bookings dashboard
-- (customer support, refund investigation, PNR troubleshooting) - only the
-- booking owner could read this table until now.
CREATE POLICY "Admins can view all passengers"
ON public.passengers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
