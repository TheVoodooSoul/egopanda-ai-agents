# 🤖 Minimax Agent + Supabase Integration

This project demonstrates how to securely integrate a Minimax AI agent with Supabase authentication and edge functions.

## 📋 Prerequisites

- A Supabase account and project
- A Minimax API key
- Supabase CLI installed
- Node.js (for local development)

## 🚀 Quick Setup

### 1. Install Supabase CLI

```bash
# Windows (using npm)
npm install -g supabase

# Or using Chocolatey
choco install supabase

# Or download from: https://github.com/supabase/cli/releases
```

### 2. Initialize Supabase Project

```bash
# Login to Supabase
supabase login

# Initialize the project (if not already done)
supabase init

# Link to your existing project
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Set Environment Variables

Set your Minimax API key as a Supabase secret:

```bash
supabase secrets set MINIMAX_API_KEY=your_minimax_api_key_here
```

### 4. Deploy the Edge Function

```bash
# Deploy the function
supabase functions deploy minmax-agent-auth

# Check if deployment was successful
supabase functions list
```

### 5. Create Database Table (Optional)

For usage tracking, create this table in your Supabase dashboard:

```sql
CREATE TABLE minimax_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  prompt_length INTEGER,
  response_tokens INTEGER,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE minimax_usage ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own usage
CREATE POLICY "Users can view their own usage" ON minimax_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow the service role to insert
CREATE POLICY "Service can insert usage" ON minimax_usage
  FOR INSERT WITH CHECK (true);
```

## 🔧 Configuration

### Frontend Configuration

1. Get your Supabase URL and Anon Key from your project settings
2. Update the frontend code with these values
3. Make sure your domain is added to the allowed origins in Supabase

### CORS Settings

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Add your domain to "Site URL" and "Additional URLs"

## 📁 Project Structure

```
minimax-supabase-integration/
├── supabase/
│   └── functions/
│       └── minmax-agent-auth/
│           └── index.ts          # Edge Function
├── index.html                    # Frontend example
├── client.js                     # JavaScript client
└── README.md                     # This file
```

## 💻 Usage Examples

### HTML Frontend

Open `index.html` in your browser:

1. Enter your Supabase URL and Anon Key
2. Click "Initialize Connection"
3. Sign up or sign in
4. Start chatting with the Minimax agent

### JavaScript Client

```javascript
import { MinimaxSupabaseClient } from './client.js'

const client = new MinimaxSupabaseClient(
  'https://yourproject.supabase.co',
  'your-anon-key'
)

// Initialize
await client.initialize()

// Sign in
await client.signIn('user@example.com', 'password')

// Send message
const response = await client.sendMessage('Hello, AI!')
console.log(response.message)
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Missing Authorization header"
- Make sure you're signed in before calling the edge function
- Check that your Supabase client is properly initialized

#### 2. "Minimax API error"
- Verify your MINIMAX_API_KEY is correctly set
- Check your Minimax API quota and usage

#### 3. "Edge function not found"
- Ensure the function is deployed: `supabase functions list`
- Check the function name matches exactly: `minmax-agent-auth`

#### 4. CORS errors
- Add your domain to Supabase allowed origins
- Check that the frontend is using the correct Supabase URL

### Testing the Edge Function

You can test the edge function directly:

```bash
# Test with curl (replace with your actual values)
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/minmax-agent-auth' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Hello, how are you?"}'
```

### Debug Edge Function Logs

```bash
# View function logs
supabase functions logs minmax-agent-auth
```

## 📝 Environment Variables

The edge function uses these environment variables:

- `SUPABASE_URL` - Automatically set by Supabase
- `SUPABASE_ANON_KEY` - Automatically set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically set by Supabase
- `MINIMAX_API_KEY` - Set this manually with `supabase secrets set`

## 🔐 Security Features

- **JWT Authentication**: All requests require valid user authentication
- **Row Level Security**: Usage tracking respects user permissions
- **API Key Protection**: Minimax API key is securely stored as a Supabase secret
- **CORS Protection**: Configurable allowed origins

## 🚀 Deployment to Production

1. **Set production secrets**:
   ```bash
   supabase secrets set MINIMAX_API_KEY=your_production_api_key
   ```

2. **Deploy edge function**:
   ```bash
   supabase functions deploy minmax-agent-auth
   ```

3. **Update frontend**:
   - Replace development URLs with production URLs
   - Ensure CORS settings include your production domain

4. **Monitor usage**:
   - Check edge function logs regularly
   - Monitor Minimax API usage and costs

## 📊 Monitoring

### View Usage Statistics

```sql
-- Top users by token usage
SELECT 
  u.email,
  COUNT(*) as requests,
  SUM(response_tokens) as total_tokens
FROM minimax_usage mu
JOIN auth.users u ON mu.user_id = u.id
GROUP BY u.id, u.email
ORDER BY total_tokens DESC;

-- Daily usage
SELECT 
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM(response_tokens) as tokens
FROM minimax_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🛠 Customization

### Adding New Models

Update the edge function to support additional models:

```typescript
// In the edge function
const model = options?.model || 'minmax-llama3.1-hybrid'
const supportedModels = [
  'minmax-llama3.1-hybrid',
  'minmax-gpt-4',
  // Add more models here
]

if (!supportedModels.includes(model)) {
  return new Response(
    JSON.stringify({ error: 'Unsupported model' }),
    { status: 400 }
  )
}
```

### Adding Rate Limiting

Implement rate limiting by tracking usage per user:

```sql
-- Create rate limiting table
CREATE TABLE user_rate_limits (
  user_id UUID REFERENCES auth.users(id),
  requests_count INTEGER DEFAULT 0,
  reset_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  PRIMARY KEY (user_id)
);
```

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs: `supabase functions logs minmax-agent-auth`
3. Verify your Minimax API key and quota
4. Check Supabase project settings and CORS configuration

## 📄 License

This project is provided as an example. Please ensure you comply with both Supabase and Minimax terms of service when using this code.

---

Happy coding! 🎉
