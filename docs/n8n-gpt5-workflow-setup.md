# n8n GPT-5 Workflow Setup Guide

## Workflow Architecture
```
Agent Chat → Webhook Trigger → HTTP Request to OpenAI → Response Handler → Return to Agent
```

## n8n Workflow Configuration

### 1. Webhook Trigger Node
- **Name**: `Agent Chat Webhook`
- **HTTP Method**: `POST`
- **Path**: `/agent-chat`
- **Authentication**: Optional (Bearer token or signature verification)

### 2. HTTP Request Node (OpenAI GPT-5)
- **Name**: `GPT-5 API Call`
- **Method**: `POST`
- **URL**: `https://api.openai.com/v1/responses`

#### Headers:
```json
{
  "Authorization": "Bearer {{ $env.OPENAI_API_KEY }}",
  "Content-Type": "application/json",
  "OpenAI-Beta": "responses=1"
}
```

#### Request Body:
```json
{
  "model": "gpt-5",
  "max_completion_tokens": 2000,
  "modalities": ["text"],
  "messages": [
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "{{ $json.system_prompt }}"
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text", 
          "text": "{{ $json.user_message }}"
        }
      ]
    }
  ]
}
```

### 3. Response Handler Node
- **Name**: `Format Response`
- **Function**: Extract the GPT-5 response and format for agent

#### JavaScript Code:
```javascript
// Extract the AI response
const response = $input.all()[0].json;
const aiMessage = response.choices[0].message.content[0].text;

// Format response for agent
return [{
  json: {
    agent_id: $json.agent_id,
    response: aiMessage,
    timestamp: new Date().toISOString(),
    model_used: "gpt-5",
    tokens_used: response.usage?.completion_tokens || 0
  }
}];
```

### 4. Webhook Response Node
- **Name**: `Return to Agent`
- **Response Body**: 
```json
{
  "success": true,
  "response": "{{ $json.response }}",
  "agent_id": "{{ $json.agent_id }}"
}
```

## Environment Variables in n8n
- `OPENAI_API_KEY`: Your OpenAI API key
- `WEBHOOK_SECRET`: Optional webhook signature verification

## Agent Integration
Update your Agent Memory Manager with:
- **n8n Webhook URL**: `https://your-n8n-instance.com/webhook/agent-chat`
- **Authentication Token**: Your n8n webhook secret
- **Expected Payload Format**: 
```json
{
  "agent_id": "vanessa",
  "user_message": "Create a marketing strategy",
  "system_prompt": "You are Vanessa, VP of Operations...",
  "context": "Recent memories and agent state..."
}
```

## Testing
Send a POST request to your n8n webhook:
```bash
curl -X POST https://your-n8n-instance.com/webhook/agent-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{
    "agent_id": "vanessa",
    "user_message": "What projects should we prioritize?",
    "system_prompt": "You are Vanessa, VP of Operations with full authority over all agents...",
    "context": "Current projects: 3 active, Revenue target: $100/day"
  }'
```
