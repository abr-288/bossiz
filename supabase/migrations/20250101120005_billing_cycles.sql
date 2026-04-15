-- Migration for Billing Cycles (Monthly/Yearly) and Pricing System
-- Adds flexible billing cycles and pricing tiers to subscription plans

-- Update subscription_plans table to support multiple billing cycles
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS billing_cycles JSONB DEFAULT '{"monthly": {"price": null, "active": true}, "yearly": {"price": null, "active": true, "discount_percentage": 10}}',
ADD COLUMN IF NOT EXISTS default_billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

-- Create pricing tiers table for more complex pricing
CREATE TABLE IF NOT EXISTS subscription_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(plan_id) ON DELETE CASCADE,
    billing_cycle TEXT NOT NULL, -- 'monthly', 'yearly'
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    discount_percentage DECIMAL(5,2) DEFAULT 0.00, -- discount compared to monthly
    setup_fee DECIMAL(10,2) DEFAULT 0.00,
    trial_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, billing_cycle)
);

-- Create billing periods table to track individual billing cycles
CREATE TABLE IF NOT EXISTS billing_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    billing_cycle TEXT NOT NULL, -- 'monthly', 'yearly'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'cancelled'
    payment_method_id TEXT,
    payment_intent_id TEXT,
    invoice_id TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'card', 'bank_account', 'paypal', 'crypto'
    provider TEXT NOT NULL, -- 'stripe', 'paypal', 'coinbase'
    method_identifier TEXT NOT NULL, -- card last 4, bank account suffix, etc.
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB, -- store provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    billing_period_id UUID REFERENCES billing_periods(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    items JSONB, -- array of line items
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update user_subscriptions with billing cycle info
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- Insert pricing data for existing plans
INSERT INTO subscription_pricing (plan_id, billing_cycle, price, currency, discount_percentage, trial_days) VALUES
-- Majestic Access pricing
('access', 'monthly', 499.00, 'EUR', 0.00, 7),
('access', 'yearly', 4990.00, 'EUR', 17.00, 14), -- 17% discount (2 months free)

-- Majestic Privé pricing  
('access_prive', 'monthly', 999.00, 'EUR', 0.00, 14),
('access_prive', 'yearly', 9990.00, 'EUR', 17.00, 30), -- 17% discount (2 months free)

-- Majestic Black pricing
('access_black', 'monthly', 1999.00, 'EUR', 0.00, 30),
('access_black', 'yearly', 19990.00, 'EUR', 17.00, 60), -- 17% discount (2 months free)

-- Standard plans pricing
('visa', 'monthly', 99.00, 'EUR', 0.00, 0),
('visa', 'yearly', 990.00, 'EUR', 17.00, 0),

('billets', 'monthly', 79.00, 'EUR', 0.00, 0),
('billets', 'yearly', 790.00, 'EUR', 17.00, 0),

('events', 'monthly', 149.00, 'EUR', 0.00, 0),
('events', 'yearly', 1490.00, 'EUR', 17.00, 0)
ON CONFLICT (plan_id, billing_cycle) DO NOTHING;

-- Update subscription_plans with default pricing data
UPDATE subscription_plans SET 
    billing_cycles = jsonb_build_object(
        'monthly', jsonb_build_object(
            'price', (SELECT price FROM subscription_pricing sp WHERE sp.plan_id = subscription_plans.plan_id AND sp.billing_cycle = 'monthly'),
            'active', true,
            'trial_days', (SELECT trial_days FROM subscription_pricing sp WHERE sp.plan_id = subscription_plans.plan_id AND sp.billing_cycle = 'monthly')
        ),
        'yearly', jsonb_build_object(
            'price', (SELECT price FROM subscription_pricing sp WHERE sp.plan_id = subscription_plans.plan_id AND sp.billing_cycle = 'yearly'),
            'active', true,
            'discount_percentage', (SELECT discount_percentage FROM subscription_pricing sp WHERE sp.plan_id = subscription_plans.plan_id AND sp.billing_cycle = 'yearly'),
            'trial_days', (SELECT trial_days FROM subscription_pricing sp WHERE sp.plan_id = subscription_plans.plan_id AND sp.billing_cycle = 'yearly')
        )
    )
WHERE plan_id IN ('access', 'access_prive', 'access_black', 'visa', 'billets', 'events');

-- Create function to calculate next billing date
CREATE OR REPLACE FUNCTION calculate_next_billing_date(
    current_date TIMESTAMP WITH TIME ZONE,
    billing_cycle TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    IF billing_cycle = 'monthly' THEN
        RETURN current_date + INTERVAL '1 month';
    ELSIF billing_cycle = 'yearly' THEN
        RETURN current_date + INTERVAL '1 year';
    ELSE
        RETURN current_date + INTERVAL '1 month'; -- default to monthly
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to create billing period
CREATE OR REPLACE FUNCTION create_billing_period(
    p_user_subscription_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
    v_billing_period_id UUID;
    v_subscription RECORD;
    v_pricing RECORD;
    v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get subscription details
    SELECT us.*, sp.plan_id INTO v_subscription
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.plan_id
    WHERE us.id = p_user_subscription_id;
    
    -- Get pricing for this billing cycle
    SELECT price, currency INTO v_pricing
    FROM subscription_pricing
    WHERE plan_id = v_subscription.plan_id AND billing_cycle = v_subscription.billing_cycle;
    
    -- Calculate end date
    v_end_date := calculate_next_billing_date(p_start_date, v_subscription.billing_cycle);
    
    -- Create billing period
    INSERT INTO billing_periods (
        user_subscription_id,
        billing_cycle,
        start_date,
        end_date,
        amount,
        currency,
        due_date
    ) VALUES (
        p_user_subscription_id,
        v_subscription.billing_cycle,
        p_start_date,
        v_end_date,
        v_pricing.price,
        v_pricing.currency,
        v_end_date - INTERVAL '3 days' -- Due 3 days before end
    ) RETURNING id INTO v_billing_period_id;
    
    -- Update subscription next billing date
    UPDATE user_subscriptions
    SET next_billing_date = v_end_date
    WHERE id = p_user_subscription_id;
    
    RETURN v_billing_period_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle subscription renewal
CREATE OR REPLACE FUNCTION renew_subscription(
    p_user_subscription_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_end_date TIMESTAMP WITH TIME ZONE;
    v_new_billing_period_id UUID;
BEGIN
    -- Check if subscription should be renewed
    SELECT end_date INTO v_current_end_date
    FROM user_subscriptions
    WHERE id = p_user_subscription_id AND cancel_at_period_end = false;
    
    IF v_current_end_date IS NULL OR v_current_end_date > NOW() THEN
        RETURN false; -- Not time to renew or cancelled
    END IF;
    
    -- Create new billing period
    v_new_billing_period_id := create_billing_period(p_user_subscription_id, v_current_end_date);
    
    -- Update subscription dates
    UPDATE user_subscriptions
    SET 
        start_date = v_current_end_date,
        end_date = calculate_next_billing_date(v_current_end_date, billing_cycle),
        updated_at = NOW()
    WHERE id = p_user_subscription_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic billing period creation
CREATE OR REPLACE FUNCTION auto_create_billing_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Create initial billing period for new subscription
    PERFORM create_billing_period(NEW.id, NEW.start_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_billing_period_trigger
    AFTER INSERT ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_billing_period();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_pricing_plan_cycle ON subscription_pricing(plan_id, billing_cycle);
CREATE INDEX IF NOT EXISTS idx_billing_periods_subscription ON billing_periods(user_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_periods_status ON billing_periods(status);
CREATE INDEX IF NOT EXISTS idx_billing_periods_due_date ON billing_periods(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing_cycle ON user_subscriptions(billing_cycle);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_billing ON user_subscriptions(next_billing_date);

-- Enable RLS
ALTER TABLE subscription_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Subscription Pricing
CREATE POLICY "Subscription pricing is viewable by everyone" ON subscription_pricing
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription pricing" ON subscription_pricing
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Billing Periods
CREATE POLICY "Users can view their own billing periods" ON billing_periods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions us
            WHERE us.id = billing_periods.user_subscription_id
            AND us.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all billing periods" ON billing_periods
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Payment Methods
CREATE POLICY "Users can manage their own payment methods" ON payment_methods
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment methods" ON payment_methods
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Invoices
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all invoices" ON invoices
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Update triggers for updated_at columns
CREATE TRIGGER update_subscription_pricing_updated_at BEFORE UPDATE ON subscription_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_periods_updated_at BEFORE UPDATE ON billing_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
