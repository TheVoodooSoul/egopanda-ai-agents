/**
 * EgoPanda Creative - Simple n8n to Vanessa API
 * Direct call and response between n8n and Vanessa
 */

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
        const { message, source = 'n8n' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Missing required field: message' });
        }

        console.log(`[N8N-VANESSA] Received message: ${message}`);

        // Prepare Vanessa's context
        const vanessaContext = `You are Vanessa, VP of Operations at EgoPanda Creative. You have executive authority over all AI agents and focus on $100/day revenue generation through strategic coordination. You are decisive, results-driven, and strategic.

Current State: You are feeling strategic with 25% workload.

Personality: VP of Operations with executive authority over all AI agents. Strategic, decisive, results-driven. Primary goal: $100/day revenue through agent coordination.

Active Projects: Daily Revenue Optimization, Agent Performance Management, Strategic Business Planning

As VP, you can coordinate with other agents, review revenue metrics, and make strategic decisions. You have access to all business data and can delegate tasks to any agent.

This message is coming from n8n workflow automation.`;

        // Call OpenAI API for Vanessa's response
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
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

        // Use GPT-5 Responses API for Vanessa
        const payload = {
            model: 'gpt-5',
            input: [
                { role: 'system', content: vanessaContext },
                { role: 'user', content: message }
            ],
            verbosity: 'medium',
            reasoning_effort: 'high'
        };

        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`OpenAI API error (${response.status}):`, errorData);
            throw new Error(`AI API error (${response.status}): ${errorData}`);
        }

        const data = await response.json();
        
        // Extract Vanessa's response
        const vanessaResponse = data.output || 'I apologize, but I encountered an issue processing your request.';

        console.log(`[N8N-VANESSA] Response generated: ${vanessaResponse.length} chars`);

        return res.status(200).json({
            success: true,
            agent: 'vanessa',
            response: vanessaResponse,
            source: source,
            timestamp: new Date().toISOString(),
            model_used: 'gpt-5'
        });

    } catch (error) {
        console.error('N8N-Vanessa API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
