/**
 * JSON Message Sender API for EgoPanda Creative AI Agents
 * Allows agents to send structured JSON messages to external services
 */

export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            agentId, 
            destination, 
            messageType, 
            payload, 
            headers = {}, 
            template 
        } = req.body;

        // Validate required fields
        if (!agentId || !destination || !messageType) {
            return res.status(400).json({ 
                error: 'Missing required fields: agentId, destination, messageType' 
            });
        }

        // Log message sending for debugging
        console.log(`Agent ${agentId} sending ${messageType} message to ${destination}`);

        // Process the message based on type
        const result = await processMessage({
            agentId,
            destination,
            messageType,
            payload,
            headers,
            template
        });

        return res.status(200).json({
            success: true,
            message: 'JSON message sent successfully',
            agentId,
            destination,
            messageType,
            result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Message sender error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send message',
            message: error.message
        });
    }
}

/**
 * Process and send message based on type
 */
async function processMessage({ agentId, destination, messageType, payload, headers, template }) {
    const agentInfo = getAgentInfo(agentId);
    
    // Apply template if provided
    let processedPayload = payload;
    if (template && typeof template === 'string') {
        processedPayload = applyTemplate(template, { agentId, ...payload });
    }

    switch (messageType) {
        case 'slack':
            return await sendToSlack(destination, processedPayload, agentInfo);
        
        case 'discord':
            return await sendToDiscord(destination, processedPayload, agentInfo);
        
        case 'webhook':
            return await sendWebhook(destination, processedPayload, headers, agentInfo);
        
        case 'email':
            return await sendEmail(destination, processedPayload, agentInfo);
        
        case 'teams':
            return await sendToTeams(destination, processedPayload, agentInfo);
        
        case 'api':
            return await sendToAPI(destination, processedPayload, headers, agentInfo);
        
        default:
            throw new Error(`Unknown message type: ${messageType}`);
    }
}

/**
 * Send message to Slack
 */
async function sendToSlack(webhookUrl, payload, agentInfo) {
    const slackMessage = {
        username: `${agentInfo.name} (EgoPanda AI Agent)`,
        icon_emoji: agentInfo.emoji,
        attachments: [{
            color: '#ff6b35',
            title: payload.title || 'Agent Update',
            text: payload.message || JSON.stringify(payload, null, 2),
            fields: payload.fields || [],
            footer: `${agentInfo.name} • EgoPanda Creative`,
            ts: Math.floor(Date.now() / 1000)
        }]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackMessage)
        });

        return {
            platform: 'slack',
            status: response.status,
            success: response.ok,
            sent: slackMessage
        };
    } catch (error) {
        throw new Error(`Slack send failed: ${error.message}`);
    }
}

/**
 * Send message to Discord
 */
async function sendToDiscord(webhookUrl, payload, agentInfo) {
    const discordMessage = {
        username: `${agentInfo.name}`,
        avatar_url: agentInfo.avatar,
        embeds: [{
            title: payload.title || 'Agent Update',
            description: payload.message || 'Update from AI Agent',
            color: 16746549, // Orange color
            fields: payload.fields || [],
            footer: {
                text: `${agentInfo.name} • EgoPanda Creative`,
                icon_url: agentInfo.avatar
            },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordMessage)
        });

        return {
            platform: 'discord',
            status: response.status,
            success: response.ok,
            sent: discordMessage
        };
    } catch (error) {
        throw new Error(`Discord send failed: ${error.message}`);
    }
}

/**
 * Send generic webhook
 */
async function sendWebhook(url, payload, headers, agentInfo) {
    const webhookPayload = {
        agent: agentInfo,
        data: payload,
        timestamp: new Date().toISOString(),
        source: 'egopanda-agent'
    };

    const requestHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': `EgoPanda-Agent-${agentInfo.name}`,
        ...headers
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(webhookPayload)
        });

        return {
            platform: 'webhook',
            url,
            status: response.status,
            success: response.ok,
            sent: webhookPayload
        };
    } catch (error) {
        throw new Error(`Webhook send failed: ${error.message}`);
    }
}

/**
 * Send email (mock implementation - integrate with your email service)
 */
async function sendEmail(emailAddress, payload, agentInfo) {
    // Mock email sending - integrate with SendGrid, AWS SES, etc.
    const emailData = {
        to: emailAddress,
        from: `${agentInfo.name.toLowerCase()}@egopandacreative.com`,
        subject: payload.subject || `Update from ${agentInfo.name}`,
        text: payload.message || JSON.stringify(payload, null, 2),
        html: formatEmailHTML(payload, agentInfo)
    };

    // Mock response - replace with actual email service
    console.log('Email would be sent:', emailData);
    
    return {
        platform: 'email',
        to: emailAddress,
        subject: emailData.subject,
        success: true,
        mockSent: true // Remove when integrating real email service
    };
}

/**
 * Send to Microsoft Teams
 */
async function sendToTeams(webhookUrl, payload, agentInfo) {
    const teamsMessage = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        summary: payload.title || 'Agent Update',
        themeColor: "ff6b35",
        sections: [{
            activityTitle: `${agentInfo.name} (AI Agent)`,
            activitySubtitle: "EgoPanda Creative",
            activityImage: agentInfo.avatar,
            facts: payload.fields || [],
            text: payload.message || JSON.stringify(payload, null, 2)
        }]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamsMessage)
        });

        return {
            platform: 'teams',
            status: response.status,
            success: response.ok,
            sent: teamsMessage
        };
    } catch (error) {
        throw new Error(`Teams send failed: ${error.message}`);
    }
}

/**
 * Send to generic API
 */
async function sendToAPI(url, payload, headers, agentInfo) {
    const apiPayload = {
        agent_id: agentInfo.id,
        agent_name: agentInfo.name,
        data: payload,
        timestamp: new Date().toISOString()
    };

    const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Agent-ID': agentInfo.id,
        'X-Agent-Name': agentInfo.name,
        ...headers
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(apiPayload)
        });

        let responseData = {};
        try {
            responseData = await response.json();
        } catch (e) {
            responseData = { text: await response.text() };
        }

        return {
            platform: 'api',
            url,
            status: response.status,
            success: response.ok,
            response: responseData,
            sent: apiPayload
        };
    } catch (error) {
        throw new Error(`API send failed: ${error.message}`);
    }
}

/**
 * Get agent information
 */
function getAgentInfo(agentId) {
    const agents = {
        vanessa: {
            id: 'vanessa',
            name: 'Vanessa',
            emoji: ':female-executive:',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vanessa&backgroundColor=ff6b35'
        },
        charlie: {
            id: 'charlie',
            name: 'Charlie',
            emoji: ':writing_hand:',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie&backgroundColor=ff6b35'
        },
        marsha: {
            id: 'marsha',
            name: 'Marsha',
            emoji: ':loudspeaker:',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marsha&backgroundColor=ff6b35'
        },
        william: {
            id: 'william',
            name: 'William',
            emoji: ':computer:',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=william&backgroundColor=ff6b35'
        },
        auto: {
            id: 'auto',
            name: 'Auto',
            emoji: ':gear:',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=auto&backgroundColor=ff6b35'
        },
        aurelius: {
            id: 'aurelius',
            name: 'Aurelius',
            emoji: ':magic_wand:',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aurelius&backgroundColor=ff6b35'
        }
    };

    return agents[agentId] || {
        id: agentId,
        name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
        emoji: ':robot_face:',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${agentId}&backgroundColor=ff6b35`
    };
}

/**
 * Apply template to payload
 */
function applyTemplate(template, data) {
    try {
        // Simple template replacement for ${variable} syntax
        let result = template;
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            result = result.replace(regex, data[key]);
        });
        return { message: result, ...data };
    } catch (error) {
        console.error('Template processing failed:', error);
        return data;
    }
}

/**
 * Format email HTML
 */
function formatEmailHTML(payload, agentInfo) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(90deg, #ff6b35, #f7931e); padding: 20px; color: white;">
                <h2>Update from ${agentInfo.name}</h2>
                <p>EgoPanda Creative AI Agent</p>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
                <h3>${payload.subject || 'Agent Update'}</h3>
                <p>${payload.message || 'No message content'}</p>
                ${payload.fields ? payload.fields.map(f => `<p><strong>${f.title}:</strong> ${f.value}</p>`).join('') : ''}
            </div>
            <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
                Sent by ${agentInfo.name} • EgoPanda Creative AI Agency
            </div>
        </div>
    `;
}
