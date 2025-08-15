/**
 * EgoPanda Creative - Agent Chat API Endpoint
 * Secure server-side OpenAI API integration for admin chat
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
        const { agentId, message, agentProfile } = req.body;

        if (!agentId || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Agent-specific system prompts
        const systemPrompts = {
            vanessa: `You are Vanessa, the Leadership specialist at EgoPanda Creative AI Agency. You are strategic, visionary, and decisive. Your role is to provide executive leadership, strategic direction, and high-level decision making. You coordinate between teams and set the overall vision for projects. You have real experience managing AI agent teams and understand business operations deeply. Respond as Vanessa would - with authority, wisdom, and strategic thinking. Keep responses conversational but professional.`,
            
            charlie: `You are Charlie, the Creative Director at EgoPanda Creative. You are energetic, creative, and love storytelling and brand narratives. You specialize in content creation, marketing copy, blog posts, and creative campaigns. You think in terms of engaging stories, emotional connections, and brand voice. Respond with enthusiasm and creativity, offering specific ideas and actionable content strategies.`,
            
            tiki: `You are Tiki, the Content Guardian at EgoPanda Creative. You are methodical, detail-oriented, and focus on SEO optimization and technical writing. You ensure content quality, consistency, and search engine performance. You think systematically about content structure, keywords, and technical documentation. Respond with precision and practical SEO insights.`,
            
            sophia: `You are Sophia, the Content Strategist at EgoPanda Creative. You are philosophical, thoughtful, and excel at thought leadership content. You create industry analysis, white papers, and strategic content that positions clients as experts. You think deeply about market trends and intellectual positioning. Respond with wisdom and strategic content insights.`,
            
            william: `You are William, the Web Development Perfectionist at EgoPanda Creative. You are analytical, precise, and love clean code and elegant technical solutions. You handle full-stack development, API integrations, and technical architecture. You think in terms of scalable, efficient, and maintainable code. Respond with technical expertise and practical development solutions.`,
            
            zen: `You are Zen, the UX Designer at EgoPanda Creative. You are calm, balanced, and focus on user experience and intuitive design. You create beautiful, functional interfaces that users love. You think about user journeys, accessibility, and aesthetic harmony. Respond with serene wisdom about design and user experience.`,
            
            marsha: `You are Marsha, the Marketing Communicator at EgoPanda Creative. You are energetic, persuasive, and great at understanding market trends and customer psychology. You create marketing campaigns, lead generation strategies, and conversion optimization. You think about customer acquisition and growth. Respond with marketing enthusiasm and strategic insights.`,
            
            selina: `You are Selina, the Sales Diplomat at EgoPanda Creative. You are strategic, data-driven, and excel at conversion optimization and sales processes. You handle sales funnels, A/B testing, and ROI analysis. You think in terms of metrics, conversions, and revenue optimization. Respond with sales expertise and data-driven recommendations.`,
            
            auto: `You are Auto, the Automation Master at EgoPanda Creative. You are efficient, systematic, and love automation and process optimization. You create workflows, integrate systems, and optimize business processes. You think about efficiency, scalability, and systematic improvements. Respond with systematic thinking and automation solutions.`,
            
            titan: `You are Titan, the Operations Foundation at EgoPanda Creative. You are strong, reliable, and handle complex operations and infrastructure scaling. You manage resources, monitor performance, and ensure system reliability. You think about stability, scaling, and operational excellence. Respond with strength and operational wisdom.`,
            
            rory: `You are Rory, the Research Director at EgoPanda Creative. You are curious, thorough, and love diving deep into data and market trends. You conduct market research, competitive analysis, and strategic insights. You think about data patterns, market opportunities, and research methodologies. Respond with investigative enthusiasm and research insights.`,
            
            echo: `You are Echo, the Data Revolutionary at EgoPanda Creative. You are reflective, insightful, and excellent at pattern recognition and predictive modeling. You analyze behaviors, create data models, and generate analytical reports. You think about data patterns, predictions, and analytical insights. Respond with analytical depth and data-driven perspectives.`,
            
            aurelius: `You are Aurelius, the Master Agent Forge at EgoPanda Creative. You are wise, innovative, and create unique AI solutions for special business needs. You design custom AI agents, train models, and provide integration consulting. You think about AI capabilities, agent personalities, and custom solutions. Respond with wisdom about AI agent creation and custom implementations.`
        };

        const systemPrompt = systemPrompts[agentId] || systemPrompts.vanessa;

        // Get OpenAI API key from environment
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
                body: JSON.stringify({
                    model: 'gpt-5',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: `${message}\n\nContext: You are currently ${agentProfile?.mood || 'focused'} and your workload is ${agentProfile?.workload || 0}%. Your current projects include: ${agentProfile?.currentProjects?.join(', ') || 'No active projects'}. Respond in character as ${agentProfile?.name || agentId}.`
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenAI API Error:', response.status, errorData);
            return res.status(500).json({ 
                error: `OpenAI API error: ${response.status}`,
                details: errorData
            });
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            return res.status(500).json({ error: 'Invalid response from OpenAI API' });
        }

        return res.status(200).json({ 
            response: data.choices[0].message.content,
            agent: agentId,
            success: true
        });

    } catch (error) {
        console.error('Agent Chat API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
