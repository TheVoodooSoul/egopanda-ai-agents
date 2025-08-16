/**
 * Webhook Handler for EgoPanda Creative AI Agents
 * Routes incoming webhooks to appropriate agents based on their configurations
 */

export default async function handler(req, res) {
    // Handle CORS for webhook testing
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
        const { source, event, data, agentId, signature } = req.body;
        
        // Log webhook for debugging
        console.log('Webhook received:', { source, event, agentId, timestamp: new Date().toISOString() });

        // Validate webhook source and signature (basic implementation)
        if (!source || !event) {
            return res.status(400).json({ error: 'Missing required fields: source, event' });
        }

        // Route webhook to appropriate agent handler
        const result = await routeWebhookToAgent({
            source,
            event,
            data,
            agentId,
            signature,
            headers: req.headers
        });

        return res.status(200).json({
            success: true,
            message: 'Webhook processed successfully',
            agentResponse: result
        });

    } catch (error) {
        console.error('Webhook handler error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

/**
 * Route webhook to appropriate agent based on configuration
 */
async function routeWebhookToAgent({ source, event, data, agentId, signature, headers }) {
    // Mock agent configurations (in production, this would come from database/storage)
    const agentConfigurations = await getAgentConfigurations();
    
    let targetAgents = [];
    
    // If specific agent is targeted
    if (agentId && agentConfigurations[agentId]) {
        targetAgents = [{ id: agentId, config: agentConfigurations[agentId] }];
    } else {
        // Find all agents that should handle this webhook
        for (const [id, config] of Object.entries(agentConfigurations)) {
            if (shouldHandleWebhook(config, source, event)) {
                targetAgents.push({ id, config });
            }
        }
    }

    if (targetAgents.length === 0) {
        console.log(`No agents configured to handle ${source}.${event}`);
        return { message: 'No agents configured for this webhook', processed: false };
    }

    const results = [];
    
    // Process webhook for each target agent
    for (const agent of targetAgents) {
        try {
            const result = await processWebhookForAgent(agent, { source, event, data, signature, headers });
            results.push({
                agentId: agent.id,
                success: true,
                result
            });
        } catch (error) {
            console.error(`Error processing webhook for agent ${agent.id}:`, error);
            results.push({
                agentId: agent.id,
                success: false,
                error: error.message
            });
        }
    }

    return {
        processed: true,
        agentsNotified: targetAgents.length,
        results
    };
}

/**
 * Check if agent should handle this webhook
 */
function shouldHandleWebhook(agentConfig, source, event) {
    if (!agentConfig.webhooks || !agentConfig.webhooks.incoming) {
        return false;
    }

    return agentConfig.webhooks.incoming.some(webhook => 
        webhook.service === source && 
        (webhook.event === event || webhook.event === 'all')
    );
}

/**
 * Process webhook for a specific agent
 */
async function processWebhookForAgent(agent, webhookData) {
    const { source, event, data } = webhookData;
    
    // Find matching webhook configuration
    const webhookConfig = agent.config.webhooks.incoming.find(w => 
        w.service === source && (w.event === event || w.event === 'all')
    );

    if (!webhookConfig) {
        throw new Error('No matching webhook configuration found');
    }

    // Execute any configured triggers
    const triggerResults = [];
    if (agent.config.webhooks.triggers) {
        for (const trigger of agent.config.webhooks.triggers) {
            if (trigger.when === 'incoming') {
                try {
                    const result = await executeTrigger(agent.id, trigger, webhookData);
                    triggerResults.push({ triggerId: trigger.name, result });
                } catch (error) {
                    triggerResults.push({ triggerId: trigger.name, error: error.message });
                }
            }
        }
    }

    // Handle specific webhook events
    let actionResult = {};
    switch (`${source}.${event}`) {
        case 'stripe.payment.success':
        case 'square.payment.success':
            actionResult = await handlePaymentSuccess(agent.id, data);
            break;
        
        case 'discord.message.received':
        case 'slack.message.received':
            actionResult = await handleMessageReceived(agent.id, data);
            break;
        
        case 'github.push':
            actionResult = await handleCodePush(agent.id, data);
            break;
        
        default:
            actionResult = await handleGenericWebhook(agent.id, webhookData);
    }

    return {
        webhookConfig: webhookConfig.name,
        actionResult,
        triggerResults,
        processedAt: new Date().toISOString()
    };
}

/**
 * Execute a webhook trigger
 */
async function executeTrigger(agentId, trigger, webhookData) {
    switch (trigger.action) {
        case 'notify':
            return await sendNotification(agentId, trigger.details, webhookData);
        
        case 'execute':
            return await executeWorkflow(agentId, trigger.details, webhookData);
        
        case 'delegate':
            return await delegateToAgent(trigger.details, webhookData);
        
        case 'update':
            return await updateData(agentId, trigger.details, webhookData);
        
        default:
            throw new Error(`Unknown trigger action: ${trigger.action}`);
    }
}

/**
 * Event handlers for specific webhook types
 */
async function handlePaymentSuccess(agentId, data) {
    // Handle payment success (notify sales agents, update customer records, etc.)
    return {
        action: 'payment_processed',
        customer: data.customer_email || 'Unknown',
        amount: data.amount || 0,
        agentNotified: agentId
    };
}

async function handleMessageReceived(agentId, data) {
    // Handle incoming message (could trigger AI response, log conversation, etc.)
    return {
        action: 'message_processed',
        from: data.user || 'Unknown',
        message: data.text || '',
        agentResponding: agentId
    };
}

async function handleCodePush(agentId, data) {
    // Handle code push (could trigger deployment, testing, etc.)
    return {
        action: 'code_push_processed',
        repository: data.repository || 'Unknown',
        commits: data.commits?.length || 0,
        agentHandling: agentId
    };
}

async function handleGenericWebhook(agentId, webhookData) {
    // Generic webhook handler
    return {
        action: 'generic_webhook_processed',
        source: webhookData.source,
        event: webhookData.event,
        dataReceived: !!webhookData.data,
        agentHandling: agentId
    };
}

/**
 * Trigger action implementations
 */
async function sendNotification(agentId, details, webhookData) {
    // Mock notification sending
    console.log(`Sending notification from agent ${agentId}:`, details);
    return { notificationSent: true, details };
}

async function executeWorkflow(agentId, workflowName, webhookData) {
    // Mock workflow execution
    console.log(`Executing workflow "${workflowName}" for agent ${agentId}`);
    return { workflowExecuted: workflowName, status: 'started' };
}

async function delegateToAgent(targetAgent, webhookData) {
    // Mock agent delegation
    console.log(`Delegating webhook to agent: ${targetAgent}`);
    return { delegatedTo: targetAgent, status: 'delegated' };
}

async function updateData(agentId, updateDetails, webhookData) {
    // Mock data update
    console.log(`Updating data for agent ${agentId}:`, updateDetails);
    return { dataUpdated: true, details: updateDetails };
}

/**
 * Get agent configurations (mock implementation)
 * In production, this would fetch from your database/storage
 */
async function getAgentConfigurations() {
    // This is a mock - in production you'd load from database or file system
    // For now, we'll return configurations for key agents
    return {
        vanessa: {
            webhooks: {
                incoming: [
                    { service: 'stripe', event: 'payment.success', name: 'Revenue Tracking' },
                    { service: 'square', event: 'payment.success', name: 'Square Payments' }
                ],
                triggers: [
                    {
                        name: 'Revenue Alert',
                        when: 'incoming',
                        action: 'notify',
                        details: 'New payment received - update daily revenue tracking'
                    }
                ]
            }
        },
        marsha: {
            webhooks: {
                incoming: [
                    { service: 'discord', event: 'message.received', name: 'Customer Support' },
                    { service: 'slack', event: 'message.received', name: 'Team Communication' }
                ],
                triggers: [
                    {
                        name: 'Customer Response',
                        when: 'incoming',
                        action: 'execute',
                        details: 'customer_support_workflow'
                    }
                ]
            }
        },
        william: {
            webhooks: {
                incoming: [
                    { service: 'github', event: 'push', name: 'Code Deployment' }
                ],
                triggers: [
                    {
                        name: 'Deploy Website',
                        when: 'incoming',
                        action: 'execute',
                        details: 'deployment_workflow'
                    }
                ]
            }
        }
    };
}
