// Test OpenAI API key and check available models
async function testOpenAI() {
    // You'll need to set your API key here for local testing
    const API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here';
    
    console.log('Testing OpenAI API connectivity...');
    console.log('API Key present:', !!API_KEY);
    console.log('API Key starts with:', API_KEY ? API_KEY.substring(0, 7) + '...' : 'No key');
    
    try {
        // Test 1: List available models
        console.log('\n--- Testing Models List ---');
        const modelsResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (modelsResponse.ok) {
            const models = await modelsResponse.json();
            const modelNames = models.data.map(m => m.id).sort();
            console.log('Available models:', modelNames.length);
            
            // Check for GPT-5
            const hasGPT5 = modelNames.some(name => name.includes('gpt-5'));
            console.log('GPT-5 available:', hasGPT5);
            
            // List GPT models
            const gptModels = modelNames.filter(name => name.startsWith('gpt'));
            console.log('GPT models available:', gptModels);
        } else {
            console.error('Models list failed:', modelsResponse.status, await modelsResponse.text());
        }
        
        // Test 2: Try GPT-4o
        console.log('\n--- Testing GPT-4o ---');
        const gpt4Response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{role: 'user', content: 'Say hello'}],
                max_completion_tokens: 50
            })
        });
        
        if (gpt4Response.ok) {
            const data = await gpt4Response.json();
            console.log('GPT-4o works:', data.choices[0].message.content);
        } else {
            console.error('GPT-4o failed:', gpt4Response.status, await gpt4Response.text());
        }
        
        // Test 3: Try GPT-5
        console.log('\n--- Testing GPT-5 ---');
        const gpt5Response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-5',
                messages: [{role: 'user', content: 'Say hello'}],
                max_completion_tokens: 50
            })
        });
        
        if (gpt5Response.ok) {
            const data = await gpt5Response.json();
            console.log('GPT-5 works:', data.choices[0].message.content);
        } else {
            const errorText = await gpt5Response.text();
            console.error('GPT-5 failed:', gpt5Response.status);
            console.error('Error details:', errorText);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testOpenAI();
