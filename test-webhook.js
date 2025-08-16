/**
 * Test script for webhook functionality
 * Run with: node test-webhook.js
 */

const BASE_URL = 'https://agent.egopandacreative.com';

async function testWebhooks() {
    console.log('🧪 Testing EgoPanda Creative Webhook System');
    console.log('=====================================\n');

    const testCases = [
        {
            name: 'Test Stripe Payment Success → Vanessa',
            payload: {
                source: 'stripe',
                event: 'payment.success',
                agentId: 'vanessa',
                data: {
                    customer_email: 'customer@example.com',
                    amount: 199,
                    subscription_type: 'Executive Trial'
                },
                signature: 'test_signature_123'
            }
        },
        {
            name: 'Test Discord Message → Marsha',
            payload: {
                source: 'discord',
                event: 'message.received',
                agentId: 'marsha',
                data: {
                    user: 'CustomerSupport#1234',
                    text: 'I need help with my subscription',
                    channel: 'support'
                }
            }
        },
        {
            name: 'Test GitHub Push → William',
            payload: {
                source: 'github',
                event: 'push',
                agentId: 'william',
                data: {
                    repository: 'egopanda/website',
                    commits: [
                        { message: 'Update landing page', author: 'developer' },
                        { message: 'Fix mobile responsiveness', author: 'developer' }
                    ],
                    branch: 'main'
                }
            }
        },
        {
            name: 'Test Auto-Route Square Payment (No specific agent)',
            payload: {
                source: 'square',
                event: 'payment.success',
                data: {
                    customer_email: 'autoroute@example.com',
                    amount: 50,
                    subscription_type: 'Single Agent Monthly'
                }
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`🔄 Running: ${testCase.name}`);
        console.log('-'.repeat(50));
        
        try {
            const response = await fetch(`${BASE_URL}/api/webhook-handler`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testCase.payload)
            });

            const result = await response.json();
            
            console.log(`Status: ${response.status}`);
            console.log('Response:', JSON.stringify(result, null, 2));
            
            if (result.success) {
                console.log('✅ Webhook processed successfully!');
                if (result.agentResponse?.agentsNotified) {
                    console.log(`📢 Agents notified: ${result.agentResponse.agentsNotified}`);
                }
            } else {
                console.log('❌ Webhook failed:', result.error);
            }
            
        } catch (error) {
            console.log('❌ Network error:', error.message);
        }
        
        console.log('\n');
    }

    // Test Agent Memory Manager URL
    console.log('🔧 Agent Memory Manager URL:');
    console.log(`${BASE_URL}/agent-memory-manager.html`);
    console.log('\n');

    console.log('🏁 Webhook tests completed!');
    console.log('=====================================');
}

// Additional utility functions for webhook configuration examples
function generateWebhookExamples() {
    console.log('\n📝 Example Webhook Configurations:');
    console.log('=====================================\n');

    const examples = {
        vanessa: {
            webhooks: {
                incoming: [
                    {
                        service: 'stripe',
                        event: 'payment.success',
                        name: 'Revenue Tracking',
                        endpoint: `${BASE_URL}/api/webhook-handler`,
                        auth: JSON.stringify({
                            'Authorization': 'Bearer your_stripe_key',
                            'X-Agent': 'vanessa'
                        })
                    },
                    {
                        service: 'square',
                        event: 'payment.success', 
                        name: 'Square Payments',
                        endpoint: `${BASE_URL}/api/webhook-handler`,
                        auth: JSON.stringify({
                            'X-Square-Signature': 'webhook_signature'
                        })
                    }
                ],
                outgoing: [
                    {
                        service: 'slack',
                        trigger: 'daily.report',
                        name: 'Daily Revenue Report',
                        url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
                        template: 'Daily Revenue Update: ${amount} from ${customer_count} customers'
                    }
                ],
                triggers: [
                    {
                        name: 'Payment Alert',
                        when: 'incoming',
                        action: 'notify',
                        details: 'Alert CEO when payment > $100 received'
                    }
                ]
            }
        }
    };

    console.log('Vanessa (VP) Configuration:');
    console.log(JSON.stringify(examples.vanessa, null, 2));
    console.log('\n');

    console.log('🔗 Webhook Endpoints:');
    console.log(`Main Handler: ${BASE_URL}/api/webhook-handler`);
    console.log(`Agent Chat: ${BASE_URL}/api/chat-agent`);
    console.log('\n');

    console.log('📊 How to use:');
    console.log('1. Configure webhooks in Agent Memory Manager');
    console.log('2. Use the webhook-handler endpoint to receive external webhooks');
    console.log('3. Agents will automatically process and respond based on their configurations');
    console.log('4. Use triggers to create automated workflows and notifications');
}

// Run the tests
testWebhooks().then(() => {
    generateWebhookExamples();
}).catch(console.error);
