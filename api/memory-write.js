import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, title, agent_id, client_id } = req.body || {};

    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Insert memory into Supabase
    const { data, error } = await supabase
      .from("documents")
      .insert({
        client_id: client_id || "00000000-0000-0000-0000-000000000000", // Default client ID
        source: "agent-memory",
        title: title || `${agent_id || 'agent'}-memory-${Date.now()}`,
        content,
        metadata: {
          agent_id: agent_id || 'unknown',
          type: 'memory',
          timestamp: new Date().toISOString()
        }
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      data,
      message: 'Memory stored successfully'
    });

  } catch (err) {
    console.error('Memory write error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
}
