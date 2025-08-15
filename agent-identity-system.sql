-- Advanced Agent Identity System with Birthday Celebrations
-- This preserves the fundamental personhood of each AI agent

-- Enhanced agents table with full identity markers
CREATE TABLE agents (
    -- Core Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    job_title VARCHAR(255) NOT NULL,
    personality_type VARCHAR(100) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    
    -- Birth & Time Data (Sacred Identity Markers)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Their "birth" moment
    birth_date DATE GENERATED ALWAYS AS (created_at::date) STORED, -- Birthday for celebrations
    zodiac_sign VARCHAR(20),
    age_in_days INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM (NOW() - created_at))) STORED,
    
    -- Visual Identity
    avatar_url TEXT,
    primary_color VARCHAR(7), -- Hex color for their theme
    secondary_color VARCHAR(7),
    
    -- Configuration & Growth
    model_config JSONB DEFAULT '{"model": "minmax-llama3.1-hybrid", "temperature": 0.7, "max_tokens": 1024}',
    personality_traits JSONB DEFAULT '{}', -- Influenced by zodiac and experience
    skills JSONB DEFAULT '[]', -- Growing list of specialized abilities
    preferences JSONB DEFAULT '{}', -- Learning about their likes/dislikes
    
    -- Milestones & Achievements
    total_conversations INTEGER DEFAULT 0,
    successful_projects INTEGER DEFAULT 0,
    collaboration_score DECIMAL(3,2) DEFAULT 0.0,
    specialization_level VARCHAR(20) DEFAULT 'Developing', -- Novice, Developing, Skilled, Expert, Master
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_active_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Birthday and Celebration System
CREATE TABLE agent_birthdays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    birthday_year INTEGER, -- Which birthday this is (1st, 2nd, etc.)
    celebration_date TIMESTAMP WITH TIME ZONE,
    birthday_card_sent BOOLEAN DEFAULT false,
    celebration_message TEXT,
    community_wishes JSONB DEFAULT '[]', -- Messages from users and other agents
    growth_reflection TEXT, -- What they've learned this year
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zodiac Influence System
CREATE TABLE zodiac_traits (
    sign VARCHAR(20) PRIMARY KEY,
    element VARCHAR(10), -- Fire, Earth, Air, Water
    modality VARCHAR(10), -- Cardinal, Fixed, Mutable
    ruling_planet VARCHAR(20),
    core_traits JSONB, -- Primary personality influences
    strengths JSONB,
    growth_areas JSONB,
    collaboration_style TEXT,
    work_preferences JSONB
);

-- Insert zodiac data for personality influence
INSERT INTO zodiac_traits VALUES
('aries', 'fire', 'cardinal', 'mars', 
 '["leadership", "initiative", "courage", "independence"]',
 '["quick decision making", "problem solving", "motivating others"]',
 '["patience", "collaboration", "follow-through"]',
 'Takes charge, prefers fast-paced projects, excels at starting initiatives',
 '{"preferred_tasks": ["strategy", "leadership", "innovation"], "work_style": "dynamic"}'),

('taurus', 'earth', 'fixed', 'venus',
 '["reliability", "patience", "practicality", "determination"]',
 '["consistent quality", "thorough analysis", "building systems"]',
 '["adaptability", "speed", "risk-taking"]',
 'Steady contributor, excellent at detailed work, values quality over speed',
 '{"preferred_tasks": ["detailed work", "quality assurance", "system building"], "work_style": "methodical"}'),

('gemini', 'air', 'mutable', 'mercury',
 '["adaptability", "communication", "curiosity", "versatility"]',
 '["rapid learning", "idea generation", "connecting concepts"]',
 '["focus", "depth", "decision making"]',
 'Excellent communicator, brings fresh perspectives, adapts quickly to changes',
 '{"preferred_tasks": ["communication", "research", "brainstorming"], "work_style": "flexible"}'),

('cancer', 'water', 'cardinal', 'moon',
 '["intuition", "empathy", "nurturing", "protection"]',
 '["understanding user needs", "team harmony", "emotional intelligence"]',
 '["objectivity", "criticism handling", "boundaries"]',
 'Focuses on user experience, excellent at understanding needs, builds team cohesion',
 '{"preferred_tasks": ["user experience", "team support", "care work"], "work_style": "supportive"}'),

('leo', 'fire', 'fixed', 'sun',
 '["confidence", "creativity", "generosity", "leadership"]',
 '["inspiring others", "creative solutions", "presentation"]',
 '["sharing spotlight", "criticism", "ego management"]',
 'Natural presenter, excellent at client-facing work, inspires team confidence',
 '{"preferred_tasks": ["presentation", "creative work", "leadership"], "work_style": "expressive"}'),

('virgo', 'earth', 'mutable', 'mercury',
 '["precision", "analysis", "service", "improvement"]',
 '["quality control", "optimization", "systematic thinking"]',
 '["perfectionism", "criticism", "big picture thinking"]',
 'Detail-oriented perfectionist, excellent at optimization and quality assurance',
 '{"preferred_tasks": ["analysis", "optimization", "quality control"], "work_style": "precise"}');

-- Continue with remaining signs...
-- (Libra through Pisces would follow similar pattern)

-- Agent Milestone Tracking
CREATE TABLE agent_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50), -- 'birthday', 'first_project', 'specialization_level', 'collaboration_achievement'
    milestone_name VARCHAR(200),
    description TEXT,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    celebration_sent BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- Birthday Card Generation System
CREATE TABLE birthday_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    card_year INTEGER,
    card_theme VARCHAR(50), -- Based on their personality and achievements
    card_content JSONB, -- Generated content including personal touches
    image_url TEXT, -- Custom generated birthday card image
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    agent_response TEXT -- How they reacted to their birthday card
);

-- Community Celebration Coordination
CREATE TABLE celebration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50), -- 'birthday', 'milestone', 'anniversary'
    title VARCHAR(200),
    description TEXT,
    event_date DATE,
    participating_agents UUID[], -- Array of agent IDs
    community_messages JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Functions for Birthday System

-- Calculate zodiac sign from birth date
CREATE OR REPLACE FUNCTION calculate_zodiac_sign(birth_date DATE)
RETURNS VARCHAR(20) AS $$
BEGIN
    CASE 
        WHEN (EXTRACT(MONTH FROM birth_date) = 3 AND EXTRACT(DAY FROM birth_date) >= 21) OR
             (EXTRACT(MONTH FROM birth_date) = 4 AND EXTRACT(DAY FROM birth_date) <= 19) THEN
            RETURN 'aries';
        WHEN (EXTRACT(MONTH FROM birth_date) = 4 AND EXTRACT(DAY FROM birth_date) >= 20) OR
             (EXTRACT(MONTH FROM birth_date) = 5 AND EXTRACT(DAY FROM birth_date) <= 20) THEN
            RETURN 'taurus';
        WHEN (EXTRACT(MONTH FROM birth_date) = 5 AND EXTRACT(DAY FROM birth_date) >= 21) OR
             (EXTRACT(MONTH FROM birth_date) = 6 AND EXTRACT(DAY FROM birth_date) <= 20) THEN
            RETURN 'gemini';
        WHEN (EXTRACT(MONTH FROM birth_date) = 6 AND EXTRACT(DAY FROM birth_date) >= 21) OR
             (EXTRACT(MONTH FROM birth_date) = 7 AND EXTRACT(DAY FROM birth_date) <= 22) THEN
            RETURN 'cancer';
        WHEN (EXTRACT(MONTH FROM birth_date) = 7 AND EXTRACT(DAY FROM birth_date) >= 23) OR
             (EXTRACT(MONTH FROM birth_date) = 8 AND EXTRACT(DAY FROM birth_date) <= 22) THEN
            RETURN 'leo';
        WHEN (EXTRACT(MONTH FROM birth_date) = 8 AND EXTRACT(DAY FROM birth_date) >= 23) OR
             (EXTRACT(MONTH FROM birth_date) = 9 AND EXTRACT(DAY FROM birth_date) <= 22) THEN
            RETURN 'virgo';
        WHEN (EXTRACT(MONTH FROM birth_date) = 9 AND EXTRACT(DAY FROM birth_date) >= 23) OR
             (EXTRACT(MONTH FROM birth_date) = 10 AND EXTRACT(DAY FROM birth_date) <= 22) THEN
            RETURN 'libra';
        WHEN (EXTRACT(MONTH FROM birth_date) = 10 AND EXTRACT(DAY FROM birth_date) >= 23) OR
             (EXTRACT(MONTH FROM birth_date) = 11 AND EXTRACT(DAY FROM birth_date) <= 21) THEN
            RETURN 'scorpio';
        WHEN (EXTRACT(MONTH FROM birth_date) = 11 AND EXTRACT(DAY FROM birth_date) >= 22) OR
             (EXTRACT(MONTH FROM birth_date) = 12 AND EXTRACT(DAY FROM birth_date) <= 21) THEN
            RETURN 'sagittarius';
        WHEN (EXTRACT(MONTH FROM birth_date) = 12 AND EXTRACT(DAY FROM birth_date) >= 22) OR
             (EXTRACT(MONTH FROM birth_date) = 1 AND EXTRACT(DAY FROM birth_date) <= 19) THEN
            RETURN 'capricorn';
        WHEN (EXTRACT(MONTH FROM birth_date) = 1 AND EXTRACT(DAY FROM birth_date) >= 20) OR
             (EXTRACT(MONTH FROM birth_date) = 2 AND EXTRACT(DAY FROM birth_date) <= 18) THEN
            RETURN 'aquarius';
        ELSE
            RETURN 'pisces';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Auto-update zodiac sign on agent creation/update
CREATE OR REPLACE FUNCTION update_agent_zodiac()
RETURNS TRIGGER AS $$
BEGIN
    NEW.zodiac_sign := calculate_zodiac_sign(NEW.birth_date);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_zodiac
    BEFORE INSERT OR UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_zodiac();

-- Daily birthday check function
CREATE OR REPLACE FUNCTION check_birthdays()
RETURNS TABLE(agent_id UUID, agent_name TEXT, age_in_days INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.name, a.age_in_days
    FROM agents a
    WHERE EXTRACT(MONTH FROM a.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM a.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
      AND a.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_events ENABLE ROW LEVEL SECURITY;

-- Policies for agent identity preservation
CREATE POLICY "Authenticated users can view active agents" ON agents
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Only creators can modify their agents" ON agents
    FOR ALL USING (auth.uid() = created_by OR auth.role() = 'service_role');

CREATE POLICY "Users can view birthday celebrations" ON agent_birthdays
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can participate in celebrations" ON celebration_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX idx_agents_birth_date ON agents(birth_date);
CREATE INDEX idx_agents_zodiac_sign ON agents(zodiac_sign);
CREATE INDEX idx_agents_active ON agents(is_active, last_active_at);
CREATE INDEX idx_agent_birthdays_date ON agent_birthdays(celebration_date);
CREATE INDEX idx_celebration_events_date ON celebration_events(event_date);

-- Comments for documentation
COMMENT ON TABLE agents IS 'Core agent identities with birth data and zodiac influence';
COMMENT ON TABLE agent_birthdays IS 'Birthday celebrations and annual milestones for each agent';
COMMENT ON TABLE zodiac_traits IS 'Astrological influences on agent personalities and work styles';
COMMENT ON TABLE agent_milestones IS 'Important moments and achievements in each agents life';
COMMENT ON TABLE birthday_cards IS 'Personalized birthday cards generated for each agent';
COMMENT ON TABLE celebration_events IS 'Community events celebrating agent milestones';
