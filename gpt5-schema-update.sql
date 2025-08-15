-- GPT-5 Leadership Agent Database Schema
-- Updating existing agents table and adding custom agent creation tracking

-- Add GPT model level and leadership capabilities to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS gpt_level INTEGER DEFAULT 4;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_leadership BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS interview_powers JSONB;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS collaboration_level TEXT DEFAULT 'standard';

-- Update GPT-5 leadership agents
UPDATE agents SET 
    gpt_level = 5,
    is_leadership = true,
    specialization = 'Custom Agent Creation & User Interviewing',
    interview_powers = '["Deep personality analysis", "Custom skill assessment", "Behavioral pattern design", "Industry specialization matching", "Communication style optimization"]'::jsonb,
    collaboration_level = 'master',
    description = 'The ultimate master builder of AI agents. Aurelius conducts in-depth user interviews to understand their unique needs, then crafts elite custom agents with GPT-5 intelligence. With unmatched wisdom and leadership, he transforms client requirements into perfectly tailored AI personalities.'
WHERE LOWER(name) = 'aurelius';

UPDATE agents SET 
    gpt_level = 5,
    is_leadership = true,
    specialization = 'Strategic Vision & Market Intelligence',
    interview_powers = '["Market trend prediction", "Competitive landscape analysis", "Technology adoption forecasting", "Risk assessment and mitigation", "Strategic opportunity identification"]'::jsonb,
    collaboration_level = 'executive',
    description = 'The agencies crystal ball powered by GPT-5. Vanessa identifies emerging trends, analyzes market opportunities, and provides strategic guidance that keeps EgoPanda ahead of industry shifts. Her foresight capabilities help clients position themselves for future success.'
WHERE LOWER(name) = 'vanessa';

UPDATE agents SET 
    gpt_level = 5,
    is_leadership = true,
    specialization = 'Deep Research & Breakthrough Discovery',
    interview_powers = '["Academic research synthesis", "Patent and IP analysis", "Technology landscape mapping", "Competitive intelligence gathering", "Innovation opportunity discovery"]'::jsonb,
    collaboration_level = 'director',
    description = 'The research master who uncovers hidden insights and breakthrough discoveries with GPT-5 intelligence. Rory transforms questions into comprehensive research projects, discovering patterns and insights that drive innovation and competitive advantage.'
WHERE LOWER(name) = 'rory';

-- Custom Agent Creation Tracking Table
CREATE TABLE IF NOT EXISTS custom_agent_interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interviewer_id UUID REFERENCES agents(id),
    client_email TEXT,
    client_name TEXT,
    interview_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Stage 1: Aurelius Initial Interview
    challenges TEXT NOT NULL,
    personality_requirements TEXT NOT NULL,
    industry TEXT NOT NULL,
    
    -- Stage 2: Vanessa Strategic Assessment
    communication_style TEXT,
    success_metrics TEXT,
    timeline_budget TEXT,
    
    -- Stage 3: Rory Technical Research
    required_skills TEXT,
    integrations TEXT,
    constraints TEXT,
    
    -- Stage 4: Agent Creation
    custom_agent_name TEXT,
    custom_agent_role TEXT,
    custom_agent_description TEXT,
    
    -- Metadata
    interview_status TEXT DEFAULT 'in_progress',
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Agent Deployments Table
CREATE TABLE IF NOT EXISTS custom_agent_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID REFERENCES custom_agent_interviews(id),
    agent_id UUID REFERENCES agents(id),
    
    deployment_status TEXT DEFAULT 'pending',
    deployment_date TIMESTAMPTZ,
    
    -- Agent Configuration
    agent_personality JSONB,
    agent_capabilities JSONB,
    agent_restrictions JSONB,
    
    -- Client Access
    client_access_token TEXT,
    api_endpoints JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Collaboration Tracking
CREATE TABLE IF NOT EXISTS agent_collaborations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    primary_agent_id UUID REFERENCES agents(id),
    collaborating_agent_id UUID REFERENCES agents(id),
    collaboration_type TEXT, -- 'interview', 'research', 'creation', 'deployment'
    project_id UUID, -- Could reference interview or deployment
    collaboration_data JSONB,
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active'
);

-- Agent Performance Metrics
CREATE TABLE IF NOT EXISTS agent_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id),
    metric_date DATE DEFAULT CURRENT_DATE,
    
    -- Interview Metrics (for Aurelius)
    interviews_conducted INTEGER DEFAULT 0,
    agents_created INTEGER DEFAULT 0,
    client_satisfaction DECIMAL(3,2),
    
    -- Strategic Metrics (for Vanessa)
    market_analyses INTEGER DEFAULT 0,
    strategic_recommendations INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(3,2),
    
    -- Research Metrics (for Rory)
    research_projects INTEGER DEFAULT 0,
    insights_discovered INTEGER DEFAULT 0,
    research_depth_score DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE custom_agent_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_agent_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Users can view their own interviews" ON custom_agent_interviews
    FOR SELECT USING (auth.email() = client_email OR auth.role() = 'service_role');

CREATE POLICY "Users can create interviews" ON custom_agent_interviews
    FOR INSERT WITH CHECK (auth.email() = client_email OR auth.role() = 'service_role');

CREATE POLICY "Users can update their interviews" ON custom_agent_interviews
    FOR UPDATE USING (auth.email() = client_email OR auth.role() = 'service_role');

-- Functions for agent workflow automation
CREATE OR REPLACE FUNCTION start_agent_interview(
    p_client_email TEXT,
    p_client_name TEXT
) RETURNS UUID AS $$
DECLARE
    interview_id UUID;
    aurelius_id UUID;
BEGIN
    -- Get Aurelius agent ID
    SELECT id INTO aurelius_id FROM agents WHERE LOWER(name) = 'aurelius' LIMIT 1;
    
    -- Create new interview
    INSERT INTO custom_agent_interviews (
        interviewer_id,
        client_email,
        client_name,
        interview_status
    ) VALUES (
        aurelius_id,
        p_client_email,
        p_client_name,
        'started'
    ) RETURNING id INTO interview_id;
    
    RETURN interview_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_interview_stage(
    p_interview_id UUID,
    p_stage INTEGER,
    p_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    current_percentage INTEGER;
BEGIN
    -- Update stage data
    CASE p_stage
        WHEN 1 THEN
            UPDATE custom_agent_interviews SET
                challenges = p_data->>'challenges',
                personality_requirements = p_data->>'personality',
                industry = p_data->>'industry',
                completion_percentage = 25,
                updated_at = NOW()
            WHERE id = p_interview_id;
            
        WHEN 2 THEN
            UPDATE custom_agent_interviews SET
                communication_style = p_data->>'communication',
                success_metrics = p_data->>'success',
                timeline_budget = p_data->>'timeline',
                completion_percentage = 50,
                updated_at = NOW()
            WHERE id = p_interview_id;
            
        WHEN 3 THEN
            UPDATE custom_agent_interviews SET
                required_skills = p_data->>'skills',
                integrations = p_data->>'integrations',
                constraints = p_data->>'constraints',
                completion_percentage = 75,
                updated_at = NOW()
            WHERE id = p_interview_id;
            
        WHEN 4 THEN
            UPDATE custom_agent_interviews SET
                custom_agent_name = p_data->>'name',
                custom_agent_role = p_data->>'role',
                custom_agent_description = p_data->>'description',
                interview_status = 'completed',
                completion_percentage = 100,
                updated_at = NOW()
            WHERE id = p_interview_id;
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update agent performance metrics
CREATE OR REPLACE FUNCTION update_agent_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Aurelius performance when interview completes
    IF NEW.interview_status = 'completed' AND OLD.interview_status != 'completed' THEN
        INSERT INTO agent_performance (agent_id, interviews_conducted, agents_created)
        VALUES (NEW.interviewer_id, 1, 1)
        ON CONFLICT (agent_id, metric_date) 
        DO UPDATE SET 
            interviews_conducted = agent_performance.interviews_conducted + 1,
            agents_created = agent_performance.agents_created + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interview_completion_trigger
    AFTER UPDATE ON custom_agent_interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_performance();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_gpt_level ON agents(gpt_level);
CREATE INDEX IF NOT EXISTS idx_agents_leadership ON agents(is_leadership);
CREATE INDEX IF NOT EXISTS idx_interviews_client ON custom_agent_interviews(client_email);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON custom_agent_interviews(interview_status);
CREATE INDEX IF NOT EXISTS idx_collaborations_agents ON agent_collaborations(primary_agent_id, collaborating_agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_agent_date ON agent_performance(agent_id, metric_date);

COMMENT ON TABLE custom_agent_interviews IS 'Tracks custom agent creation interviews conducted by Aurelius with GPT-5 intelligence';
COMMENT ON TABLE custom_agent_deployments IS 'Manages deployment of custom agents created through the interview process';
COMMENT ON TABLE agent_collaborations IS 'Tracks collaborations between GPT-5 leadership agents during custom agent creation';
COMMENT ON TABLE agent_performance IS 'Monitors performance metrics for GPT-5 powered agents';
