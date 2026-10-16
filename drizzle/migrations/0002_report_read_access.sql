CREATE POLICY "report readers" ON public.beneficiaries FOR SELECT TO authenticated USING (public.can_view_reports(auth.uid()));
CREATE POLICY "report readers" ON public.training_registrations FOR SELECT TO authenticated USING (public.can_view_reports(auth.uid()));
CREATE POLICY "report readers" ON public.funding_applications FOR SELECT TO authenticated USING (public.can_view_reports(auth.uid()));