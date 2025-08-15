-- EgoPanda Creative - User Subscriptions Schema Part 1
-- Copy and paste this into Supabase SQL Editor

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
