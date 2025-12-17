-- =============================================
-- PHASE 3-5 AGENT TOOLS: DATABASE SCHEMA
-- =============================================

-- 1. INVENTORY MANAGEMENT
-- =============================================

-- Inventory items catalog
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 5,
  unit_cost NUMERIC(10,2),
  supplier TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage inventory items"
ON public.inventory_items FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view inventory items"
ON public.inventory_items FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all inventory items"
ON public.inventory_items FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Inventory transactions log
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'usage', 'reorder', 'adjustment', 'return'
  quantity INTEGER NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  employee_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage inventory transactions"
ON public.inventory_transactions FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view and create inventory transactions"
ON public.inventory_transactions FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can insert inventory transactions"
ON public.inventory_transactions FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all inventory transactions"
ON public.inventory_transactions FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- 2. QUOTING SYSTEM
-- =============================================

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'declined', 'expired'
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  valid_until TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  appointment_id UUID REFERENCES public.appointments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage quotes"
ON public.quotes FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view quotes"
ON public.quotes FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can create quotes"
ON public.quotes FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all quotes"
ON public.quotes FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE TABLE public.quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quote line items follow quote access"
ON public.quote_line_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.quotes q 
  WHERE q.id = quote_id 
  AND q.company_id = get_user_company_id(auth.uid())
));

-- 3. INVOICING SYSTEM
-- =============================================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  invoice_number TEXT,
  appointment_id UUID REFERENCES public.appointments(id),
  quote_id UUID REFERENCES public.quotes(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage invoices"
ON public.invoices FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view invoices"
ON public.invoices FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all invoices"
ON public.invoices FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoice line items follow invoice access"
ON public.invoice_line_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.invoices i 
  WHERE i.id = invoice_id 
  AND i.company_id = get_user_company_id(auth.uid())
));

-- 4. WARRANTY TRACKING
-- =============================================

CREATE TABLE public.warranty_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  equipment_type TEXT NOT NULL,
  equipment_model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  installation_date DATE,
  warranty_start_date DATE NOT NULL,
  warranty_end_date DATE NOT NULL,
  coverage_type TEXT DEFAULT 'standard', -- 'standard', 'extended', 'parts_only', 'labor_only'
  coverage_details TEXT,
  appointment_id UUID REFERENCES public.appointments(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.warranty_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage warranty records"
ON public.warranty_records FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view warranty records"
ON public.warranty_records FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can create warranty records"
ON public.warranty_records FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all warranty records"
ON public.warranty_records FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE TABLE public.warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID NOT NULL REFERENCES public.warranty_records(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  issue_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted', -- 'submitted', 'under_review', 'approved', 'denied', 'completed'
  claim_type TEXT DEFAULT 'repair', -- 'repair', 'replacement', 'refund'
  photos TEXT[],
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  appointment_id UUID REFERENCES public.appointments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage warranty claims"
ON public.warranty_claims FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view warranty claims"
ON public.warranty_claims FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can create warranty claims"
ON public.warranty_claims FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all warranty claims"
ON public.warranty_claims FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- 5. MARKETING CAMPAIGNS
-- =============================================

CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'promo', 'seasonal', 'winback', 'referral', 'announcement'
  target_segment TEXT, -- 'all', 'new_customers', 'returning', 'inactive', 'high_value'
  discount_type TEXT, -- 'percentage', 'fixed', 'free_service'
  discount_value NUMERIC(10,2),
  promo_code TEXT,
  message_template TEXT,
  email_subject TEXT,
  channels TEXT[] DEFAULT ARRAY['email'], -- 'email', 'sms'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'completed', 'cancelled'
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage marketing campaigns"
ON public.marketing_campaigns FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view marketing campaigns"
ON public.marketing_campaigns FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all marketing campaigns"
ON public.marketing_campaigns FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  channel TEXT NOT NULL, -- 'email', 'sms'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'bounced', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign recipients follow campaign access"
ON public.campaign_recipients FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all campaign recipients"
ON public.campaign_recipients FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- 6. REFERRAL PROGRAM
-- =============================================

CREATE TABLE public.customer_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  referrer_name TEXT NOT NULL,
  referrer_email TEXT,
  referrer_phone TEXT,
  referred_name TEXT,
  referred_email TEXT,
  referred_phone TEXT,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'contacted', 'booked', 'completed', 'rewarded', 'expired'
  reward_type TEXT DEFAULT 'discount', -- 'discount', 'credit', 'cash', 'free_service'
  reward_value NUMERIC(10,2),
  reward_issued_at TIMESTAMP WITH TIME ZONE,
  appointment_id UUID REFERENCES public.appointments(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage customer referrals"
ON public.customer_referrals FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view customer referrals"
ON public.customer_referrals FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all customer referrals"
ON public.customer_referrals FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- 7. WIN-BACK OFFERS
-- =============================================

CREATE TABLE public.winback_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  last_appointment_date DATE,
  days_inactive INTEGER,
  offer_type TEXT NOT NULL, -- 'discount', 'free_inspection', 'loyalty_bonus'
  offer_value NUMERIC(10,2),
  promo_code TEXT,
  message_sent TEXT,
  channel TEXT, -- 'email', 'sms'
  status TEXT NOT NULL DEFAULT 'created', -- 'created', 'sent', 'opened', 'redeemed', 'expired'
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  appointment_id UUID REFERENCES public.appointments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.winback_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage winback offers"
ON public.winback_offers FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view winback offers"
ON public.winback_offers FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all winback offers"
ON public.winback_offers FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_inventory_items_company ON public.inventory_items(company_id);
CREATE INDEX idx_inventory_items_low_stock ON public.inventory_items(company_id, quantity, min_quantity) WHERE quantity <= min_quantity;
CREATE INDEX idx_inventory_transactions_company ON public.inventory_transactions(company_id);
CREATE INDEX idx_inventory_transactions_item ON public.inventory_transactions(item_id);
CREATE INDEX idx_quotes_company ON public.quotes(company_id);
CREATE INDEX idx_quotes_status ON public.quotes(company_id, status);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_invoices_status ON public.invoices(company_id, status);
CREATE INDEX idx_warranty_records_company ON public.warranty_records(company_id);
CREATE INDEX idx_warranty_records_serial ON public.warranty_records(serial_number);
CREATE INDEX idx_warranty_claims_company ON public.warranty_claims(company_id);
CREATE INDEX idx_marketing_campaigns_company ON public.marketing_campaigns(company_id);
CREATE INDEX idx_marketing_campaigns_status ON public.marketing_campaigns(company_id, status);
CREATE INDEX idx_customer_referrals_company ON public.customer_referrals(company_id);
CREATE INDEX idx_customer_referrals_code ON public.customer_referrals(referral_code);
CREATE INDEX idx_winback_offers_company ON public.winback_offers(company_id);

-- Add updated_at triggers
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warranty_records_updated_at BEFORE UPDATE ON public.warranty_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warranty_claims_updated_at BEFORE UPDATE ON public.warranty_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customer_referrals_updated_at BEFORE UPDATE ON public.customer_referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_winback_offers_updated_at BEFORE UPDATE ON public.winback_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();