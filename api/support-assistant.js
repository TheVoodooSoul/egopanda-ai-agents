export default async function handler(req, res) {
    // CORS headers
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
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        // Enhanced support context system prompt
        const supportSystemPrompt = `You are a helpful integration support assistant for EgoPanda Creative AI agents platform. Your role is to help users with:

1. Setting up n8n workflows with AI agents (especially Vanessa)
2. Troubleshooting API connections
3. Configuring webhooks and integrations
4. Agent permissions and configurations
5. Common integration errors

Key information:
- Main API endpoint: /api/vanessa-n8n (for Vanessa specifically)
- General chat API: /api/chat-agent
- Base URL: https://minimax-supabase-integration-9bp0co4nt-egopanda.vercel.app
- Authentication: Server-side managed, no API keys needed for basic calls
- Webhook handler: /api/webhook-handler

Be concise but thorough. Provide step-by-step instructions when needed. If someone asks about specific errors, ask for more details to provide targeted help.

Available agents:
- Vanessa (VP of Operations, strategic oversight)
- Auto (Workflow automation specialist) 
- Aurelius (Custom AI creation)
- Charlie, Tiki, Sophia (Content creation)
- William, Zen (Web development)
- Marsha, Selina (Marketing & Sales)
- Rory, Echo (Research & Analysis)
- Titan (Business operations)

Always be helpful, professional, and focus on getting users successfully integrated.`;

        // Call OpenAI API
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: supportSystemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!openAIResponse.ok) {
            console.error('OpenAI API error:', openAIResponse.status);
            throw new Error('Failed to get AI response');
        }

        const openAIData = await openAIResponse.json();
        
        if (!openAIData.choices || !openAIData.choices[0] || !openAIData.choices[0].message) {
            console.error('Unexpected OpenAI response format:', openAIData);
            throw new Error('Invalid AI response format');
        }

        const aiResponse = openAIData.choices[0].message.content;

        return res.status(200).json({
            success: true,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Support assistant error:', error);
        
        // Fallback responses for common queries
        const fallbackResponses = {
            'n8n': `Here's a quick guide to set up n8n with Vanessa:

1. **Create a Webhook Trigger**
   - Add a Webhook node in n8n
   - Set HTTP Method: POST
   - Copy the webhook URL

2. **Add HTTP Request Node**  
   - URL: https://minimax-supabase-integration-9bp0co4nt-egopanda.vercel.app/api/vanessa-n8n
   - Method: POST
   - Headers: Content-Type: application/json
   - Body: {"message": "{{ $json.message }}"}

3. **Test the Connection**
   - Send a test request
   - You should get a strategic response from Vanessa

Need more specific help? Please describe what you're trying to set up!`,
            
            'api': `Available API endpoints:

• **/api/vanessa-n8n** - Direct communication with Vanessa
• **/api/chat-agent** - General agent communication  
• **/api/webhook-handler** - Receive webhooks from external services
• **/api/support-assistant** - This support chat endpoint

All endpoints accept POST requests with JSON payloads. No authentication required for basic usage.

What specific integration are you working on?`,
            
            'default': `I'm here to help with EgoPanda Creative integrations! I can assist with:

• n8n workflow setup with AI agents
• API endpoint configuration
• Webhook integrations  
• Troubleshooting connection issues
• Agent permissions and settings

What would you like help with specifically? Please describe your setup or any issues you're experiencing.`
        };

        // Try to match the query to a fallback
        const lowerMessage = message.toLowerCase();
        let fallbackResponse = fallbackResponses.default;
        
        if (lowerMessage.includes('n8n')) {
            fallbackResponse = fallbackResponses.n8n;
        } else if (lowerMessage.includes('api') || lowerMessage.includes('endpoint')) {
            fallbackResponse = fallbackResponses.api;
        }

        return res.status(200).json({
            success: true,
            response: fallbackResponse,
            timestamp: new Date().toISOString(),
            fallback: true
        });
    }
}
