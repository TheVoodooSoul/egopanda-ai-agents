import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// This Edge Function demonstrates proper authentication with Supabase
// for use with a minimax agent frontend application

// Supabase client setup (using environment variables)
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Your minimax agent API key (set this with `supabase secrets set MINIMAX_API_KEY=your_key`)
const minimaxApiKey = Deno.env.get('MINIMAX_API_KEY') ?? '';

Deno.serve(async (req: Request) => {
  try {
    // CORS headers for browser compatibility
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    // Extract the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the user's JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the incoming request from the frontend
    const { prompt, agentId, conversationId, options } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: prompt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: agentId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a service role client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch agent configuration
    const { data: agent, error: agentError } = await supabaseService
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('is_active', true)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found or inactive' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data: existingConv } = await supabaseService
        .from('agent_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = existingConv;
    }

    if (!conversation) {
      const { data: newConv, error: convError } = await supabaseService
        .from('agent_conversations')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '')
        })
        .select()
        .single();

      if (convError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      conversation = newConv;
    }

    // Get conversation history (last 10 messages for context)
    const { data: messageHistory } = await supabaseService
      .from('conversation_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Build messages array with system prompt and conversation history
    const messages = [
      { role: 'system', content: agent.system_prompt }
    ];

    // Add conversation history
    if (messageHistory && messageHistory.length > 0) {
      messages.push(...messageHistory);
    }

    // Add current user message
    messages.push({ role: 'user', content: prompt });

    // Get model configuration from agent
    const modelConfig = agent.model_config || {};
    const finalOptions = {
      model: options?.model || modelConfig.model || 'minmax-llama3.1-hybrid',
      temperature: options?.temperature ?? modelConfig.temperature ?? 0.7,
      max_tokens: options?.max_tokens || modelConfig.max_tokens || 1024
    };

    // Call the minimax agent API
    const minimaxResponse = await fetch('https://api.minmax.chat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${minimaxApiKey}`
      },
      body: JSON.stringify({
        messages,
        ...finalOptions
      })
    });

    if (!minimaxResponse.ok) {
      const errorData = await minimaxResponse.json();
      return new Response(
        JSON.stringify({ error: 'Minimax API error', details: errorData }),
        { status: minimaxResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const minimaxData = await minimaxResponse.json();
    const assistantMessage = minimaxData.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return new Response(
        JSON.stringify({ error: 'Invalid response from Minimax API' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save both user and assistant messages to conversation history
    const messagesToSave = [
      {
        conversation_id: conversation.id,
        role: 'user',
        content: prompt,
        metadata: { options }
      },
      {
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantMessage,
        metadata: { model: finalOptions.model, usage: minimaxData.usage }
      }
    ];

    const { error: messageError } = await supabaseService
      .from('conversation_messages')
      .insert(messagesToSave);

    if (messageError) {
      console.warn('Failed to save conversation messages:', messageError);
    }

    // Log usage to Supabase for tracking (updated to include agent_id)
    const { error: logError } = await supabaseService
      .from('minimax_usage')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        prompt_length: prompt.length,
        response_tokens: minimaxData.usage?.total_tokens || 0,
        model: finalOptions.model,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.warn('Failed to log usage:', logError);
    }

    // Return the enhanced response with agent and conversation info
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: user.email,
        agent: {
          id: agent.id,
          name: agent.name,
          job_title: agent.job_title,
          personality_type: agent.personality_type
        },
        conversation: {
          id: conversation.id,
          title: conversation.title
        },
        response: minimaxData
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
