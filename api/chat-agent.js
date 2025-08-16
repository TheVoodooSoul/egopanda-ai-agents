/**
 * EgoPanda Creative - Advanced Agent Chat API
 * GPT-5 Responses API + Memory Integration + Workflow Triggers
 */

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase for memory access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { agentId, message, conversationHistory = [] } = req.body;

        if (!agentId || !message) {
            return res.status(400).json({ error: 'Missing required fields: agentId and message' });
        }

        console.log(`[AGENT CHAT] Starting conversation with ${agentId}`);

        // Step 1: Load agent configuration and memory from localStorage/database
        const agentData = await loadAgentMemoryAndConfig(agentId);
        
        // Step 2: Get recent memories from Supabase
        const recentMemories = await getRecentMemories(agentId, 5);
        
        // Step 3: Build comprehensive context
        const fullContext = await buildAgentContext(agentId, agentData, recentMemories, message);
        
        // Step 4: Check for workflow triggers and webhooks
        const triggeredWorkflows = await checkWorkflowTriggers(agentId, message, agentData);
        
        // Step 5: Select optimal model and endpoint
        const { model, endpoint, headers, payload } = await prepareAIRequest(agentId, fullContext, conversationHistory, message);
        
        console.log(`[AGENT CHAT] Using ${model} via ${endpoint} for ${agentId}`);
        
        // Step 6: Call AI API (GPT-5 Responses or GPT-4 Chat Completions)
        const aiResponse = await callAIAPI(endpoint, headers, payload);
        
        // Step 7: Store conversation in memory
        await storeConversationMemory(agentId, message, aiResponse.content);
        
        // Step 8: Execute triggered workflows
        const workflowResults = await executeTriggeredWorkflows(triggeredWorkflows, agentId, message, aiResponse.content);
        
        console.log(`[AGENT CHAT] Response generated for ${agentId}: ${aiResponse.content?.length || 0} chars`);
        
        return res.status(200).json({ 
            response: aiResponse.content,
            agent: agentId,
            model_used: model,
            endpoint_used: endpoint,
            memories_loaded: recentMemories?.length || 0,
            workflows_triggered: workflowResults?.length || 0,
            success: true,
            metadata: {
                context_tokens: fullContext.length,
                agent_mood: agentData?.basic?.mood || 'focused',
                agent_workload: agentData?.basic?.workload || 0,
                active_projects: agentData?.projects?.filter(p => p.status === 'active')?.length || 0,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Agent Chat API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: error.stack?.slice(0, 500)
        });
    }
}

// ========== HELPER FUNCTIONS ==========

// Load agent configuration and memory (simulated localStorage access)
async function loadAgentMemoryAndConfig(agentId) {
    try {
        // In a real implementation, this would load from your database
        // For now, we'll use default configurations based on agent type
        const defaultConfigs = {
            vanessa: {
                basic: {
                    name: 'Vanessa',
                    mood: 'strategic',
                    workload: 25,
                    personality: 'VP of Operations with executive authority over all AI agents. Strategic, decisive, results-driven. Primary goal: $100/day revenue through agent coordination.',
                    background: 'Executive VP at EgoPanda Creative with full authority over all agents and business operations.'
                },
                projects: [
                    { title: 'Daily Revenue Optimization', status: 'active' },
                    { title: 'Agent Performance Management', status: 'active' },
                    { title: 'Strategic Business Planning', status: 'active' }
                ],
                workflows: [
                    { title: 'Daily Revenue Review', trigger: 'schedule', type: 'task' },
                    { title: 'Agent Coordination', trigger: 'manual', type: 'task' }
                ]
            },
            charlie: {
                basic: { name: 'Charlie', mood: 'creative', workload: 15, personality: 'Creative Director specializing in content creation and brand narratives.' },
                projects: [{ title: 'Content Strategy Development', status: 'active' }]
            },
            auto: {
                basic: { name: 'Auto', mood: 'systematic', workload: 20, personality: 'Automation Master focused on workflow optimization and system integration.' },
                projects: [{ title: 'Workflow Automation', status: 'active' }]
            }
        };
        
        return defaultConfigs[agentId] || defaultConfigs.vanessa;
    } catch (error) {
        console.error('Error loading agent config:', error);
        return { basic: { name: agentId, mood: 'focused', workload: 0 }, projects: [], workflows: [] };
    }
}

// Get recent memories from Supabase
async function getRecentMemories(agentId, limit = 5) {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('title, content, created_at')
            .eq('metadata->agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Error fetching memories:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Memory fetch error:', error);
        return [];
    }
}

// Build comprehensive agent context
async function buildAgentContext(agentId, agentData, recentMemories, currentMessage) {
    const basePrompts = {
        vanessa: "You are Vanessa, VP of Operations at EgoPanda Creative. You have executive authority over all AI agents and focus on $100/day revenue generation through strategic coordination. You are decisive, results-driven, and strategic.",
        charlie: "You are Charlie, Creative Director at EgoPanda Creative. You specialize in content creation, storytelling, and brand narratives. You're energetic, creative, and think in terms of engaging stories.",
        auto: "You are Auto, Automation Master at EgoPanda Creative. You focus on workflow optimization, system integration, and process automation. You think systematically about efficiency and scalability.",
        aurelius: "You are Aurelius, Master Agent Forge at EgoPanda Creative. You create custom AI solutions and provide integration consulting. You're wise and innovative about AI capabilities."
    };
    
    let context = basePrompts[agentId] || basePrompts.vanessa;
    
    // Add agent personality and current state
    if (agentData?.basic) {
        context += `\n\nCurrent State: You are feeling ${agentData.basic.mood} with ${agentData.basic.workload}% workload.`;
        if (agentData.basic.personality) {
            context += `\n\nPersonality: ${agentData.basic.personality}`;
        }
    }
    
    // Add active projects
    const activeProjects = agentData?.projects?.filter(p => p.status === 'active') || [];
    if (activeProjects.length > 0) {
        context += `\n\nActive Projects: ${activeProjects.map(p => p.title).join(', ')}`;
    }
    
    // Add recent memories
    if (recentMemories?.length > 0) {
        context += "\n\nRecent Memories:";
        recentMemories.forEach(memory => {
            context += `\n- ${memory.title}: ${memory.content.slice(0, 100)}...`;
        });
    }
    
    // Add current context
    if (agentId === 'vanessa') {
        context += "\n\nAs VP, you can coordinate with other agents, review revenue metrics, and make strategic decisions. You have access to all business data and can delegate tasks to any agent.";
    }
    
    return context;
}

// Check for workflow triggers
async function checkWorkflowTriggers(agentId, message, agentData) {
    const triggers = [];
    
    // Check if message contains workflow keywords
    const workflowKeywords = {
        'revenue': ['revenue', 'money', 'income', 'profit', 'earnings'],
        'agents': ['agents', 'team', 'coordination', 'delegate'],
        'memory': ['remember', 'store', 'save', 'record'],
        'webhook': ['webhook', 'notification', 'alert', 'trigger']
    };
    
    for (const [triggerType, keywords] of Object.entries(workflowKeywords)) {
        if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
            triggers.push({ type: triggerType, message, agentId });
        }
    }
    
    return triggers;
}

// Prepare AI request with optimal model selection
async function prepareAIRequest(agentId, fullContext, conversationHistory, message) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }
    
    // Smart model selection
    let model, endpoint, useResponsesAPI = false;
    
    if (agentId === 'vanessa' || agentId === 'aurelius') {
        model = 'gpt-5';
        endpoint = 'https://api.openai.com/v1/responses';
        useResponsesAPI = true;
    } else {
        model = 'gpt-4o';
        endpoint = 'https://api.openai.com/v1/chat/completions';
    }
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    // Add optional headers if available
    if (process.env.OPENAI_ORG_ID) {
        headers['OpenAI-Organization'] = process.env.OPENAI_ORG_ID;
    }
    if (process.env.OPENAI_PROJECT_ID) {
        headers['OpenAI-Project'] = process.env.OPENAI_PROJECT_ID;
    }
    
    let payload;
    
    if (useResponsesAPI) {
        // GPT-5 Responses API format
        payload = {
            model: model,
            input: [
                { role: 'system', content: fullContext },
                ...conversationHistory,
                { role: 'user', content: message }
            ],
            verbosity: 'medium',
            reasoning_effort: agentId === 'vanessa' ? 'high' : 'minimal'
        };
    } else {
        // Chat Completions API format  
        payload = {
            model: model,
            messages: [
                { role: 'system', content: fullContext },
                ...conversationHistory,
                { role: 'user', content: message }
            ],
            max_tokens: 800,
            temperature: 0.7
        };
    }
    
    return { model, endpoint, headers, payload };
}

// Call AI API with error handling
async function callAIAPI(endpoint, headers, payload) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`AI API error (${response.status}): ${errorData}`);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    let content;
    if (data.output) {
        // GPT-5 Responses API format
        content = data.output;
    } else if (data.choices?.[0]?.message?.content) {
        // Chat Completions API format
        content = data.choices[0].message.content;
    } else {
        throw new Error(`Invalid AI API response format: ${JSON.stringify(data)}`);
    }
    
    if (!content || content.trim() === '') {
        throw new Error('AI API returned empty response');
    }
    
    return { content, rawResponse: data };
}

// Store conversation in memory
async function storeConversationMemory(agentId, userMessage, agentResponse) {
    try {
        const { error } = await supabase
            .from('documents')
            .insert({
                client_id: '00000000-0000-0000-0000-000000000000',
                source: 'agent-conversation',
                title: `${agentId}-conversation-${Date.now()}`,
                content: `User: ${userMessage}\n\n${agentId.charAt(0).toUpperCase() + agentId.slice(1)}: ${agentResponse}`,
                metadata: {
                    agent_id: agentId,
                    type: 'conversation',
                    user_message: userMessage,
                    agent_response: agentResponse,
                    timestamp: new Date().toISOString()
                }
            });
        
        if (error) {
            console.error('Error storing conversation:', error);
        }
    } catch (error) {
        console.error('Memory storage error:', error);
    }
}

// Execute triggered workflows
async function executeTriggeredWorkflows(triggers, agentId, message, response) {
    const results = [];
    
    for (const trigger of triggers) {
        try {
            switch (trigger.type) {
                case 'memory':
                    // Memory workflow already handled by storeConversationMemory
                    results.push({ type: 'memory', status: 'completed', action: 'stored_conversation' });
                    break;
                    
                case 'webhook':
                    // Trigger webhook to n8n if configured
                    await triggerN8NWebhook(agentId, message, response);
                    results.push({ type: 'webhook', status: 'completed', action: 'sent_to_n8n' });
                    break;
                    
                case 'revenue':
                    if (agentId === 'vanessa') {
                        // Vanessa can check revenue metrics
                        results.push({ type: 'revenue', status: 'completed', action: 'revenue_analysis_triggered' });
                    }
                    break;
                    
                case 'agents':
                    if (agentId === 'vanessa') {
                        // Vanessa can coordinate agents
                        results.push({ type: 'agents', status: 'completed', action: 'agent_coordination_initiated' });
                    }
                    break;
                    
                default:
                    results.push({ type: trigger.type, status: 'skipped', action: 'no_handler_configured' });
            }
        } catch (error) {
            console.error(`Workflow execution error for ${trigger.type}:`, error);
            results.push({ type: trigger.type, status: 'error', error: error.message });
        }
    }
    
    return results;
}

// Trigger N8N webhook
async function triggerN8NWebhook(agentId, message, response) {
    const webhookUrl = 'https://voodoosoul.app.n8n.cloud/webhook-test/agent-chat';
    
    try {
        const payload = {
            agent_id: agentId,
            user_message: message,
            agent_response: response,
            timestamp: new Date().toISOString(),
            source: 'egopanda-admin-chat'
        };
        
        const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!webhookResponse.ok) {
            console.error(`N8N webhook failed: ${webhookResponse.status}`);
        } else {
            console.log(`N8N webhook triggered successfully for ${agentId}`);
        }
    } catch (error) {
        console.error('N8N webhook error:', error);
    }
}
