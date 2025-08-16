export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { test_type = 'simple' } = req.query;
    
    console.log(`Testing GPT-5 Responses API (${test_type} test)...`);
    
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

    let testPayload;

    if (test_type === 'conversation') {
      // Test with conversation format (recommended for agents)
      testPayload = {
        model: "gpt-5",
        input: [
          { 
            role: "system", 
            content: "You are Vanessa, VP of Operations at EgoPanda Creative. You are strategic, decisive, and results-driven with full authority over all AI agents and business operations. Your primary goal is to generate $100 in daily revenue through strategic coordination and optimization." 
          },
          { 
            role: "user", 
            content: "Quick communication check - confirm you're online and ready for operations." 
          }
        ],
        // Optional GPT-5 specific parameters
        verbosity: "medium",
        reasoning_effort: "minimal"
      };
    } else {
      // Simple string input test
      testPayload = {
        model: "gpt-5",
        input: "Say: Vanessa online and operational."
      };
    }

    console.log('Calling OpenAI Responses API with payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    console.log('OpenAI API Response Status:', response.status);
    console.log('OpenAI API Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        return res.status(401).json({
          error: 'Authentication Error',
          status: response.status,
          details: data,
          troubleshooting: {
            invalid_api_key: 'Check if OPENAI_API_KEY is correct in Vercel environment',
            mismatched_project: 'If using project-scoped key, add OPENAI_PROJECT_ID to environment',
            organization_mismatch: 'If using org-scoped key, add OPENAI_ORG_ID to environment'
          }
        });
      }

      if (response.status === 404) {
        return res.status(404).json({
          error: 'Model or Endpoint Not Found',
          status: response.status,
          details: data,
          troubleshooting: {
            model_not_found: 'gpt-5 might not be available for your account yet',
            endpoint_issue: 'Responses API might not be available - try /v1/chat/completions',
            access_level: 'Check if your account has GPT-5 access'
          }
        });
      }

      return res.status(response.status).json({
        error: 'OpenAI API Error',
        status: response.status,
        details: data,
        headers_sent: Object.keys(headers).filter(key => key !== 'Authorization'),
        test_type: test_type
      });
    }

    // Success - return the response
    return res.status(200).json({
      success: true,
      message: 'GPT-5 Responses API working correctly!',
      test_type: test_type,
      response: data,
      test_info: {
        model_used: testPayload.model,
        api_endpoint: '/v1/responses',
        input_format: Array.isArray(testPayload.input) ? 'conversation' : 'simple',
        timestamp: new Date().toISOString(),
        environment: 'vercel'
      }
    });

  } catch (error) {
    console.error('GPT-5 test error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack?.slice(0, 500)
    });
  }
}
