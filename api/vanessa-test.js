export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Testing GPT-5 Responses API...');
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not found in environment variables',
        suggestion: 'Make sure OPENAI_API_KEY is set in Vercel environment'
      });
    }

    // Prepare headers
    const headers = {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    };

    // Add optional organization/project headers if available
    if (process.env.OPENAI_ORG_ID) {
      headers["OpenAI-Organization"] = process.env.OPENAI_ORG_ID;
    }
    if (process.env.OPENAI_PROJECT_ID) {
      headers["OpenAI-Project"] = process.env.OPENAI_PROJECT_ID;
    }

    // Test with simple input first
    const testPayload = {
      model: "gpt-5",
      input: "Say: Vanessa online."
    };

    console.log('Calling OpenAI Responses API with payload:', testPayload);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    console.log('OpenAI API Response Status:', response.status);
    console.log('OpenAI API Response Data:', data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'OpenAI API Error',
        status: response.status,
        details: data,
        headers_sent: Object.keys(headers).filter(key => key !== 'Authorization')
      });
    }

    // Success - return the response
    return res.status(200).json({
      success: true,
      message: 'GPT-5 Responses API working correctly',
      response: data,
      test_info: {
        model_used: testPayload.model,
        api_endpoint: 'responses',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Vanessa test error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack?.slice(0, 500) // Limit stack trace
    });
  }
}
