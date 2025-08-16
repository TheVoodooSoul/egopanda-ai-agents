import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agent_id, limit = 10, offset = 0 } = req.query || req.body || {};

    // Build query
    let query = supabase
      .from("documents")
      .select("id, title, content, created_at, metadata")
      .order("created_at", { ascending: false });

    // Filter by agent if specified
    if (agent_id) {
      query = query.eq('metadata->agent_id', agent_id);
    }

    // Apply pagination
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true,
      data,
      count: data?.length || 0,
      message: 'Memories retrieved successfully'
    });

  } catch (err) {
    console.error('Memory read error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
}
