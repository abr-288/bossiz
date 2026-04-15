-- Migration for User Subscriptions and Role-based Dashboard System
-- Links subscription plans to user roles and tracks active subscriptions

-- Table to track user subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(plan_id),
    subscription_type TEXT NOT NULL, -- 'majestic' or 'standard'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'pending'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    payment_method TEXT,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    next_payment_date TIMESTAMP WITH TIME ZONE,
    amount_paid DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, plan_id, status)
);

-- Update subscription_plans table to include role assignment
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS assigned_role TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'standard';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS assistance_level TEXT DEFAULT 'standard'; -- 'standard', 'priority', 'vip', '24/7'

-- Update existing plans with proper values
UPDATE subscription_plans SET 
    subscription_type = 'majestic',
    assigned_role = 'majestic_member',
    assistance_level = '24/7'
WHERE plan_id IN ('access', 'access_prive', 'access_black');

UPDATE subscription_plans SET 
    subscription_type = 'standard',
    assigned_role = 'standard_member',
    assistance_level = 'standard'
WHERE plan_id NOT IN ('access', 'access_prive', 'access_black');

-- Create function to assign role when subscription is created
CREATE OR REPLACE FUNCTION assign_subscription_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user metadata with new role
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || 
        jsonb_build_object(
            'role', NEW.assigned_role,
            'subscription_type', NEW.subscription_type,
            'assistance_level', NEW.assistance_level,
            'subscription_updated', NOW()
        )
    WHERE id = (
        SELECT user_id FROM user_subscriptions 
        WHERE plan_id = NEW.plan_id AND status = 'active' 
        LIMIT 1
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to assign role when subscription plan is updated
CREATE TRIGGER assign_role_on_subscription_update
    AFTER UPDATE ON subscription_plans
    FOR EACH ROW
    WHEN (OLD.assigned_role IS DISTINCT FROM NEW.assigned_role)
    EXECUTE FUNCTION assign_subscription_role();

-- Create function to update user role when subscription is activated
CREATE OR REPLACE FUNCTION update_user_subscription_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the subscription plan details
    DECLARE
        plan_record RECORD;
    BEGIN
        SELECT sp.assigned_role, sp.subscription_type, sp.assistance_level
        INTO plan_record
        FROM subscription_plans sp
        WHERE sp.plan_id = NEW.plan_id;
        
        -- Update user metadata with subscription role
        IF plan_record.assigned_role IS NOT NULL THEN
            UPDATE auth.users
            SET raw_user_meta_data = raw_user_meta_data || 
                jsonb_build_object(
                    'role', plan_record.assigned_role,
                    'subscription_type', plan_record.subscription_type,
                    'assistance_level', plan_record.assistance_level,
                    'subscription_updated', NOW()
                )
            WHERE id = NEW.user_id;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new subscriptions
CREATE TRIGGER update_role_on_new_subscription
    AFTER INSERT ON user_subscriptions
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION update_user_subscription_role();

-- Create function to remove role when subscription expires
CREATE OR REPLACE FUNCTION remove_subscription_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has other active majestic subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.plan_id
        WHERE us.user_id = OLD.user_id 
        AND us.status = 'active' 
        AND sp.subscription_type = 'majestic'
        AND us.id != OLD.id
    ) THEN
        -- Reset to standard role
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data || 
            jsonb_build_object(
                'role', 'authenticated',
                'subscription_type', 'none',
                'assistance_level', 'standard',
                'subscription_updated', NOW()
            )
        WHERE id = OLD.user_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription expiration/cancellation
CREATE TRIGGER remove_role_on_subscription_end
    AFTER UPDATE OR DELETE ON user_subscriptions
    FOR EACH ROW
    WHEN (OLD.status = 'active' AND (NEW.status IS NULL OR NEW.status != 'active' OR TG_OP = 'DELETE'))
    EXECUTE FUNCTION remove_subscription_role();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_type ON user_subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON subscription_plans(subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_role ON subscription_plans(assigned_role);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON user_subscriptions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Create view for active subscriptions with user info
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    us.*,
    u.email,
    u.raw_user_meta_data,
    sp.name as plan_name,
    sp.subscription_type,
    sp.assigned_role,
    sp.assistance_level,
    sp.price
FROM user_subscriptions us
JOIN auth.users u ON us.user_id = u.id
JOIN subscription_plans sp ON us.plan_id = sp.plan_id
WHERE us.status = 'active';

-- Enable RLS on view
ALTER TABLE active_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own active subscriptions" ON active_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all active subscriptions" ON active_subscriptions
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Insert sample majestic subscriptions for testing (remove in production)
-- This would normally be done through the subscription process
-- INSERT INTO user_subscriptions (user_id, plan_id, subscription_type, status, end_date)
-- SELECT 
--     u.id,
--     sp.plan_id,
--     sp.subscription_type,
--     'active',
--     NOW() + INTERVAL '1 month'
-- FROM auth.users u 
-- CROSS JOIN subscription_plans sp 
-- WHERE sp.subscription_type = 'majestic' 
-- AND u.email = 'test@example.com' -- Replace with actual user
-- LIMIT 1;
