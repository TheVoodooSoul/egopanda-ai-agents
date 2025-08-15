import { createClient } from '@supabase/supabase-js';

// Project credentials
const AURELIUS_URL = 'https://owalnojeylnucvmkvqvo.supabase.co';
const AURELIUS_KEY = '38687bb428633ab4513d15d3a753a3aa1af86f727f3daa44ba8004f4bb29add4';

// MMX project credentials
const MMX_URL = 'https://wnacylxdwzoiygadarsd.supabase.co';
const MMX_ANON_KEY = '49a537fd69de53c9c84dce922ead2fc414a5e3ef4829b689e0d2a2b885f15132';
const MMX_SERVICE_KEY = '2d6ac7913635adb3ab94aec20005b12c3587c47b52279ed40194b3d7b53b1d82';

async function analyzeProject(name, url, key) {
  console.log(`\n🔍 === ANALYZING ${name.toUpperCase()} PROJECT ===`);
  console.log(`URL: ${url}`);
  console.log(`Key: ${key.substring(0, 20)}...`);
  
  const supabase = createClient(url, key);
  const results = {
    name,
    agents: [],
    tables: [],
    storage: [],
    functions: []
  };
  
  try {
    // Check for agents/pandas tables
    const possibleTables = ['agents', 'pandas', 'characters', 'ai_agents', 'panda_agents', 'profiles'];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
          
        if (!error && data) {
          console.log(`\n✅ Found table: ${tableName} (${data.length} records)`);
          results.tables.push({ name: tableName, count: data.length });
          
          if (data.length > 0) {
            console.log('Sample record structure:');
            const sample = data[0];
            Object.keys(sample).forEach(key => {
              const value = sample[key];
              const valuePreview = typeof value === 'string' ? 
                (value.length > 50 ? value.substring(0, 50) + '...' : value) : 
                value;
              console.log(`   ${key}: ${valuePreview}`);
            });
            
            // If this looks like agents, store them
            if (tableName.includes('agent') || tableName.includes('panda') || tableName.includes('character')) {
              results.agents = data;
              
              console.log('\n🐼 AGENT DETAILS:');
              data.forEach((agent, i) => {
                console.log(`\n   ${i + 1}. ${agent.name || agent.character_name || 'Unnamed'}`);
                if (agent.job_title || agent.job || agent.role) {
                  console.log(`      Job: ${agent.job_title || agent.job || agent.role}`);
                }
                if (agent.personality_type || agent.personality) {
                  console.log(`      Personality: ${agent.personality_type || agent.personality}`);
                }
                if (agent.zodiac_sign || agent.zodiac) {
                  console.log(`      Zodiac: ${agent.zodiac_sign || agent.zodiac}`);
                }
                if (agent.avatar_url || agent.image_url || agent.image) {
                  console.log(`      Image: ${agent.avatar_url || agent.image_url || agent.image}`);
                }
                if (agent.description) {
                  console.log(`      Description: ${agent.description.substring(0, 100)}...`);
                }
              });
            }
          }
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }
    
    // Check storage
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (!storageError && buckets && buckets.length > 0) {
        console.log(`\n📁 Storage buckets: ${buckets.length}`);
        results.storage = buckets.map(b => b.name);
        
        for (const bucket of buckets.slice(0, 3)) { // Check first 3 buckets
          try {
            const { data: files } = await supabase.storage.from(bucket.name).list('', { limit: 5 });
            if (files && files.length > 0) {
              console.log(`   📁 ${bucket.name}: ${files.length} files`);
              files.forEach(file => console.log(`      - ${file.name}`));
            }
          } catch (e) {
            console.log(`   📁 ${bucket.name}: Access restricted`);
          }
        }
      }
    } catch (e) {
      console.log('❌ Could not access storage');
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing ${name}:`, error.message);
  }
  
  return results;
}

async function compareProjects() {
  console.log('🔄 COMPARING BOTH PROJECTS TO IDENTIFY SCATTERED DATA\n');
  
  // Analyze both projects
  const aureliusResults = await analyzeProject('AURELIUS', AURELIUS_URL, AURELIUS_KEY);
  const mmxResults = await analyzeProject('MMX', MMX_URL, MMX_ANON_KEY);
  
  // Compare and consolidate
  console.log('\n📊 === CONSOLIDATION ANALYSIS ===');
  console.log(`\n🏛️  AURELIUS PROJECT:`);
  console.log(`   Agents: ${aureliusResults.agents.length}`);
  console.log(`   Tables: ${aureliusResults.tables.map(t => `${t.name}(${t.count})`).join(', ')}`);
  console.log(`   Storage: ${aureliusResults.storage.join(', ')}`);
  
  console.log(`\n⚙️  MMX PROJECT:`);
  console.log(`   Agents: ${mmxResults.agents.length}`);
  console.log(`   Tables: ${mmxResults.tables.map(t => `${t.name}(${t.count})`).join(', ')}`);
  console.log(`   Storage: ${mmxResults.storage.join(', ')}`);
  
  // Find overlaps and differences
  console.log('\n🔍 CONSOLIDATION RECOMMENDATIONS:');
  
  if (aureliusResults.agents.length > 0 && mmxResults.agents.length > 0) {
    console.log('✅ Both projects have agents - need to merge and deduplicate');
    
    const aureliusNames = aureliusResults.agents.map(a => a.name || a.character_name).filter(n => n);
    const mmxNames = mmxResults.agents.map(a => a.name || a.character_name).filter(n => n);
    
    const uniqueToAurelius = aureliusNames.filter(name => !mmxNames.includes(name));
    const uniqueToMMX = mmxNames.filter(name => !aureliusNames.includes(name));
    const common = aureliusNames.filter(name => mmxNames.includes(name));
    
    console.log(`   🏛️  Only in Aurelius: ${uniqueToAurelius.join(', ') || 'none'}`);
    console.log(`   ⚙️  Only in MMX: ${uniqueToMMX.join(', ') || 'none'}`);
    console.log(`   🤝 Common agents: ${common.join(', ') || 'none'}`);
  } else if (aureliusResults.agents.length > 0) {
    console.log('✅ Use Aurelius as primary - has the agent data');
  } else if (mmxResults.agents.length > 0) {
    console.log('✅ Use MMX as primary - has the agent data');
  }
  
  // Check for images
  const hasAureliusImages = aureliusResults.storage.length > 0;
  const hasMMXImages = mmxResults.storage.length > 0;
  
  if (hasAureliusImages && hasMMXImages) {
    console.log('📸 Both projects have storage - need to consolidate images');
  } else if (hasAureliusImages) {
    console.log('📸 Images are in Aurelius project');
  } else if (hasMMXImages) {
    console.log('📸 Images are in MMX project');
  }
  
  return { aurelius: aureliusResults, mmx: mmxResults };
}

// Run the comparison
compareProjects().catch(console.error);
