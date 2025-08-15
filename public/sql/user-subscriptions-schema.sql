-- EgoPanda Creative - User Subscriptions Schema
-- Run this in your Supabase SQL editor to set up the subscription system

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tier TEXT NOT NULL DEFAULT 'SINGLE_AGENT',
    status TEXT NOT NULL DEFAULT 'trial',
    projects_used INTEGER DEFAULT 0,
    square_payment_id TEXT,
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_project_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_tier CHECK (tier IN (
        'SINGLE_AGENT',
        'EXECUTIVE_TRIAL', 
        'FULL_SUITE_ANNUAL',
        'EXECUTIVE_ANNUAL',
        'CUSTOM_LIFETIME'
    )),
    CONSTRAINT valid_status CHECK (status IN (
        'trial',
        'active',
        'inactive',
        'cancelled',
        'expired'
    )),
    CONSTRAINT non_negative_projects CHECK (projects_used >= 0),
    
    -- One subscription per user
    UNIQUE(user_id)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own subscription
CREATE POLICY "Users can view own subscription"
ON user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription (for signup)
CREATE POLICY "Users can create own subscription"
ON user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription (for usage tracking)
CREATE POLICY "Users can update own subscription"
ON user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks/admin)
CREATE POLICY "Service role can manage all subscriptions"
ON user_subscriptions
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create agent_usage_logs table for detailed tracking
CREATE TABLE agent_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_id TEXT NOT NULL,
    task_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'started',
    
    CONSTRAINT valid_status CHECK (status IN ('started', 'completed', 'failed'))
);

-- Enable RLS for agent_usage_logs
ALTER TABLE agent_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_usage_logs
CREATE POLICY "Users can view own agent usage"
ON agent_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent usage"
ON agent_usage_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent usage"
ON agent_usage_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to get user's current subscription with computed fields
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
    subscription_data user_subscriptions%ROWTYPE;
    tier_info JSON;
BEGIN
    -- Get subscription data
    SELECT * INTO subscription_data
    FROM user_subscriptions
    WHERE user_id = user_uuid;
    
    IF NOT FOUND THEN
        -- Return default subscription for new users
        RETURN json_build_object(
            'user_id', user_uuid,
            'tier', 'SINGLE_AGENT',
            'status', 'trial',
            'projects_used', 0,
            'tier_info', json_build_object(
                'name', 'Single Agent',
                'max_projects', 5,
                'allowed_agents', json_build_array('charlie'),
                'price', 50
            )
        );
    END IF;
    
    -- Add tier information based on tier
    CASE subscription_data.tier
        WHEN 'SINGLE_AGENT' THEN
            tier_info := json_build_object(
                'name', 'Single Agent',
                'max_projects', 5,
                'allowed_agents', json_build_array('charlie'),
                'price', 50
            );
        WHEN 'EXECUTIVE_TRIAL' THEN
            tier_info := json_build_object(
                'name', 'Executive Trial',
                'max_projects', 50,
                'allowed_agents', json_build_array('charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo'),
                'price', 99.99
            );
        WHEN 'FULL_SUITE_ANNUAL' THEN
            tier_info := json_build_object(
                'name', 'Full Suite Annual',
                'max_projects', -1,
                'allowed_agents', json_build_array('charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo', 'aurelius', 'nova', 'pixel', 'sage', 'flux', 'orbit'),
                'price', 200
            );
        WHEN 'EXECUTIVE_ANNUAL' THEN
            tier_info := json_build_object(
                'name', 'Executive Annual',
                'max_projects', -1,
                'allowed_agents', json_build_array('charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo', 'aurelius', 'nova', 'pixel', 'sage', 'flux', 'orbit'),
                'price', 1499.99
            );
        WHEN 'CUSTOM_LIFETIME' THEN
            tier_info := json_build_object(
                'name', 'Custom Lifetime',
                'max_projects', -1,
                'allowed_agents', json_build_array('aurelius'),
                'price', 1999
            );
        ELSE
            tier_info := json_build_object('name', 'Unknown', 'max_projects', 0, 'allowed_agents', json_build_array(), 'price', 0);
    END CASE;
    
    -- Return complete subscription data
    RETURN json_build_object(
        'id', subscription_data.id,
        'user_id', subscription_data.user_id,
        'tier', subscription_data.tier,
        'status', subscription_data.status,
        'projects_used', subscription_data.projects_used,
        'square_payment_id', subscription_data.square_payment_id,
        'activated_at', subscription_data.activated_at,
        'created_at', subscription_data.created_at,
        'updated_at', subscription_data.updated_at,
        'last_project_at', subscription_data.last_project_at,
        'tier_info', tier_info
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_subscription(UUID) TO authenticated;

-- Create function to check agent access
CREATE OR REPLACE FUNCTION has_agent_access(agent_name TEXT, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    subscription_info JSON;
    allowed_agents JSON;
BEGIN
    -- Get user subscription
    subscription_info := get_user_subscription(user_uuid);
    
    -- Extract allowed agents
    allowed_agents := subscription_info->'tier_info'->'allowed_agents';
    
    -- Check if agent is in allowed list
    RETURN allowed_agents ? agent_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION has_agent_access(TEXT, UUID) TO authenticated;

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_agent_usage_logs_user_id ON agent_usage_logs(user_id);
CREATE INDEX idx_agent_usage_logs_agent_id ON agent_usage_logs(agent_id);
CREATE INDEX idx_agent_usage_logs_created_at ON agent_usage_logs(created_at);

-- Insert some sample data (optional, for testing)
-- INSERT INTO user_subscriptions (user_id, tier, status, projects_used) 
-- VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'SINGLE_AGENT', 'active', 2),
--   ('11111111-1111-1111-1111-111111111111', 'FULL_SUITE_ANNUAL', 'active', 25);

COMMENT ON TABLE user_subscriptions IS 'Stores user subscription tiers and usage data for EgoPanda Creative';
COMMENT ON TABLE agent_usage_logs IS 'Tracks individual agent interactions for analytics and billing';
COMMENT ON FUNCTION get_user_subscription(UUID) IS 'Returns complete subscription data with tier information';
COMMENT ON FUNCTION has_agent_access(TEXT, UUID) IS 'Checks if user has access to specific agent based on subscription tier';
