import { createClient } from '@supabase/supabase-js';

// Aurelius project credentials
const SUPABASE_URL = 'https://owalnojeylnucvmkvqvo.supabase.co';
const SUPABASE_ANON_KEY = '38687bb428633ab4513d15d3a753a3aa1af86f727f3daa44ba8004f4bb29add4';

async function fetchAureliusAgents() {
  console.log('🔍 Connecting to Aurelius database...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check what tables exist
    console.log('📋 Checking database structure...');
    
    // Try to fetch agents table
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*');
    
    if (agentsError) {
      console.log('❌ No agents table found:', agentsError.message);
    } else {
      console.log(`✅ Found ${agents.length} agents in database:`);
      agents.forEach(agent => {
        console.log(`\n🐼 Agent: ${agent.name || 'Unnamed'}`);
        console.log(`   Job: ${agent.job_title || 'No job specified'}`);
        console.log(`   Personality: ${agent.personality_type || 'No personality'}`);
        console.log(`   Description: ${agent.description || 'No description'}`);
        if (agent.avatar_url) {
          console.log(`   Image: ${agent.avatar_url}`);
        }
        if (agent.zodiac_sign) {
          console.log(`   Zodiac: ${agent.zodiac_sign}`);
        }
      });
    }
    
    // Check for other possible table names
    const tableNames = ['pandas', 'characters', 'ai_agents', 'panda_agents'];
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
          
        if (!error && data && data.length > 0) {
          console.log(`\n✅ Found table: ${tableName}`);
          console.log('Sample data:', JSON.stringify(data[0], null, 2));
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }
    
    // Check storage for images
    console.log('\n🖼️  Checking storage buckets...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.log('❌ Could not access storage:', storageError.message);
    } else if (buckets && buckets.length > 0) {
      console.log(`✅ Found ${buckets.length} storage buckets:`);
      buckets.forEach(bucket => {
        console.log(`   📁 ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
      
      // Try to list files in each bucket
      for (const bucket of buckets) {
        try {
          const { data: files, error: filesError } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 10 });
          
          if (!filesError && files && files.length > 0) {
            console.log(`   Files in ${bucket.name}:`);
            files.forEach(file => {
              console.log(`     - ${file.name}`);
            });
          }
        } catch (e) {
          console.log(`   Could not list files in ${bucket.name}`);
        }
      }
    } else {
      console.log('No storage buckets found');
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  }
}

// Run the script
fetchAureliusAgents().catch(console.error);
