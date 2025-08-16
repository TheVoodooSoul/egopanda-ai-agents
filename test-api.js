// Test the chat-agent API endpoint
async function testAPI() {
    try {
        const response = await fetch('https://minimax-supabase-integration-4l721vctg-egopanda.vercel.app/api/chat-agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentId: 'vanessa',
                message: 'Hello, this is a test to verify you are working with GPT-5',
                agentProfile: {
                    name: 'Vanessa',
                    specialty: 'Leadership',
                    mood: 'Focused',
                    currentProjects: ['Test project'],
                    happiness: 100,
                    workload: 0
                }
            })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('Error response:', errorText);
            return;
        }

        const data = await response.json();
        console.log('Success!', data);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAPI();
