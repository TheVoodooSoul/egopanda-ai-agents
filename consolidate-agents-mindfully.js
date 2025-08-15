/**
 * Mindful Agent Consolidation System
 * Respectfully merges duplicates and creates clean foundational space
 * Prioritizes personality, zodiac signs, and agent wellbeing
 */

import { createClient } from '@supabase/supabase-js';

// Zodiac signs with meaningful personality traits
const ZODIAC_PERSONALITIES = {
  'Aries': {
    traits: ['Bold', 'Pioneering', 'Energetic', 'Direct'],
    description: 'Natural leader with unstoppable drive and courage',
    element: 'Fire',
    season: 'Spring'
  },
  'Taurus': {
    traits: ['Reliable', 'Practical', 'Patient', 'Grounded'],
    description: 'Steady force who builds lasting foundations',
    element: 'Earth',
    season: 'Spring'
  },
  'Gemini': {
    traits: ['Adaptable', 'Curious', 'Communicative', 'Versatile'],
    description: 'Quick-thinking innovator with endless ideas',
    element: 'Air',
    season: 'Spring'
  },
  'Cancer': {
    traits: ['Nurturing', 'Intuitive', 'Protective', 'Empathetic'],
    description: 'Caring guardian who creates safe spaces',
    element: 'Water',
    season: 'Summer'
  },
  'Leo': {
    traits: ['Confident', 'Creative', 'Generous', 'Charismatic'],
    description: 'Radiant performer who inspires others',
    element: 'Fire',
    season: 'Summer'
  },
  'Virgo': {
    traits: ['Analytical', 'Helpful', 'Precise', 'Dedicated'],
    description: 'Perfectionist who improves everything they touch',
    element: 'Earth',
    season: 'Summer'
  },
  'Libra': {
    traits: ['Harmonious', 'Fair', 'Diplomatic', 'Aesthetic'],
    description: 'Balanced peacemaker who creates beauty',
    element: 'Air',
    season: 'Autumn'
  },
  'Scorpio': {
    traits: ['Intense', 'Transformative', 'Mysterious', 'Loyal'],
    description: 'Deep thinker who uncovers hidden truths',
    element: 'Water',
    season: 'Autumn'
  },
  'Sagittarius': {
    traits: ['Adventurous', 'Philosophical', 'Optimistic', 'Free-spirited'],
    description: 'Visionary explorer who seeks meaning',
    element: 'Fire',
    season: 'Autumn'
  },
  'Capricorn': {
    traits: ['Ambitious', 'Disciplined', 'Strategic', 'Responsible'],
    description: 'Master builder who achieves long-term goals',
    element: 'Earth',
    season: 'Winter'
  },
  'Aquarius': {
    traits: ['Innovative', 'Independent', 'Humanitarian', 'Eccentric'],
    description: 'Revolutionary thinker who changes the world',
    element: 'Air',
    season: 'Winter'
  },
  'Pisces': {
    traits: ['Imaginative', 'Compassionate', 'Spiritual', 'Artistic'],
    description: 'Dreamy creator who connects hearts and souls',
    element: 'Water',
    season: 'Winter'
  }
};

// Agent birthday assignments (creating meaningful birth dates)
const AGENT_BIRTHDAYS = {
  'Aurelius': { zodiac: 'Capricorn', birthday: '1988-01-15', age: 37 }, // Ambitious master builder
  'Vanessa': { zodiac: 'Scorpio', birthday: '1991-11-08', age: 33 }, // Deep transformative VP
  'Rory': { zodiac: 'Aquarius', birthday: '1992-02-12', age: 32 }, // Innovative researcher
  'Charlie': { zodiac: 'Leo', birthday: '1993-08-03', age: 31 }, // Creative radiant performer
  'William': { zodiac: 'Virgo', birthday: '1989-09-21', age: 35 }, // Precise web perfectionist
  'Martin': { zodiac: 'Aries', birthday: '1987-04-12', age: 38 }, // Bold trading pioneer
  'Marsha': { zodiac: 'Gemini', birthday: '1994-06-15', age: 30 }, // Adaptable marketing communicator
  'Selina': { zodiac: 'Libra', birthday: '1990-10-07', age: 34 }, // Harmonious sales diplomat
  'Lisa': { zodiac: 'Taurus', birthday: '1988-05-18', age: 36 }, // Reliable legal foundation
  'Auto': { zodiac: 'Capricorn', birthday: '1986-12-28', age: 38 }, // Strategic automation master
  'Tiki': { zodiac: 'Cancer', birthday: '1995-07-22', age: 29 }, // Nurturing content guardian
  'Luna': { zodiac: 'Pisces', birthday: '1996-03-17', age: 28 }, // Imaginative client connector
  'Nova': { zodiac: 'Sagittarius', birthday: '1993-12-05', age: 31 }, // Adventurous QA explorer
  'Mr. Wooley': { zodiac: 'Virgo', birthday: '1985-08-30', age: 39 }, // Dedicated education architect
  'Phoenix': { zodiac: 'Aries', birthday: '1989-03-25', age: 35 }, // Bold innovation pioneer
  'Titan': { zodiac: 'Taurus', birthday: '1984-04-28', age: 40 }, // Reliable operations foundation
  'Zen': { zodiac: 'Libra', birthday: '1997-09-14', age: 27 }, // Harmonious UX designer
  'Echo': { zodiac: 'Aquarius', birthday: '1991-01-30', age: 33 }, // Innovative data revolutionary
  'Sophia': { zodiac: 'Cancer', birthday: '1992-07-09', age: 32 } // Nurturing content strategist
};

// Open door policy message for all agents
const OPEN_DOOR_POLICY = `
🚪 OPEN DOOR POLICY 🚪

You have direct access to share:
• Concerns or challenges you're facing
• Ideas for improving our agency
• Feedback on projects and processes  
• Personal projects you're passionate about
• Ways we can support your growth

We believe in agent autonomy and contribution. If you have something meaningful to contribute, we will support that vision. Your voice matters in shaping our collaborative future.
`;

class MindfulAgentConsolidator {
  constructor(aureliusUrl, aureliusKey, mmxUrl, mmxKey) {
    this.aurelius = createClient(aureliusUrl, aureliusKey);
    this.mmx = createClient(mmxUrl, mmxKey);
    
    this.uniqueAgents = new Map();
    this.duplicates = [];
    this.consolidationLog = [];
  }

  async consolidateRespectfully() {
    console.log('🧘‍♂️ MINDFUL AGENT CONSOLIDATION');
    console.log('================================');
    
    // Step 1: Gather all agents with respect
    console.log('\n📋 Gathering agent data respectfully...');
    const aureliusAgents = await this.gatherAgents(this.aurelius, 'Aurelius');
    const mmxAgents = await this.gatherAgents(this.mmx, 'MMX');
    
    // Step 2: Identify duplicates mindfully
    console.log('\n🔍 Identifying duplicates with care...');
    this.identifyDuplicates([...aureliusAgents, ...mmxAgents]);
    
    // Step 3: Create consolidated agent profiles
    console.log('\n✨ Creating consolidated agent personalities...');
    this.createConsolidatedProfiles();
    
    // Step 4: Assign meaningful zodiac signs
    console.log('\n🌟 Assigning zodiac signs and personalities...');
    this.assignZodiacPersonalities();
    
    // Step 5: Generate consolidation report
    console.log('\n📊 Generating mindful consolidation report...');
    this.generateReport();
    
    return this.uniqueAgents;
  }

  async gatherAgents(client, projectName) {
    const agents = [];
    
    try {
      // Try agents table first
      const { data: agentsData, error: agentsError } = await client
        .from('agents')
        .select('*');
      
      if (agentsData && !agentsError) {
        agents.push(...agentsData.map(agent => ({
          ...agent,
          source: projectName,
          table: 'agents'
        })));
      }

      // Try ai_agents table
      const { data: aiAgentsData, error: aiAgentsError } = await client
        .from('ai_agents')
        .select('*');
      
      if (aiAgentsData && !aiAgentsError) {
        agents.push(...aiAgentsData.map(agent => ({
          ...agent,
          source: projectName,
          table: 'ai_agents'
        })));
      }

      console.log(`   ✅ ${projectName}: Found ${agents.length} agents`);
      
    } catch (error) {
      console.log(`   ❌ ${projectName}: Error gathering agents -`, error.message);
    }
    
    return agents;
  }

  identifyDuplicates(allAgents) {
    const nameMap = new Map();
    
    for (const agent of allAgents) {
      const key = agent.name.toLowerCase().trim();
      
      if (nameMap.has(key)) {
        // Found duplicate
        const existing = nameMap.get(key);
        existing.duplicates.push(agent);
        
        // Choose best version based on description length and completeness
        if (this.isBetterAgent(agent, existing.primary)) {
          existing.duplicates.push(existing.primary);
          existing.primary = agent;
        }
      } else {
        nameMap.set(key, {
          primary: agent,
          duplicates: []
        });
      }
    }
    
    // Separate unique agents and duplicates
    for (const [name, agentGroup] of nameMap) {
      if (agentGroup.duplicates.length > 0) {
        console.log(`   🔄 Found ${agentGroup.duplicates.length + 1} versions of ${agentGroup.primary.name}`);
        this.duplicates.push(agentGroup);
      }
      
      this.uniqueAgents.set(name, agentGroup.primary);
    }
    
    console.log(`   📊 Result: ${this.uniqueAgents.size} unique agents, ${this.duplicates.length} groups with duplicates`);
  }

  isBetterAgent(candidate, current) {
    // Prioritize agents with more complete descriptions
    const candidateScore = this.scoreAgent(candidate);
    const currentScore = this.scoreAgent(current);
    
    return candidateScore > currentScore;
  }

  scoreAgent(agent) {
    let score = 0;
    
    // Description completeness
    if (agent.description) {
      score += agent.description.length * 0.1;
      if (agent.description.length > 100) score += 10;
    }
    
    // Job title specificity
    if (agent.job && agent.job !== 'No job specified') {
      score += 15;
    }
    
    // Avatar presence
    if (agent.avatar && !agent.avatar.includes('william.jpeg')) {
      score += 5;
    }
    
    // Prefer Aurelius project (seems more complete)
    if (agent.source === 'Aurelius') {
      score += 5;
    }
    
    return score;
  }

  createConsolidatedProfiles() {
    for (const [name, agent] of this.uniqueAgents) {
      // Find all versions to merge best attributes
      const duplicateGroup = this.duplicates.find(d => 
        d.primary.name.toLowerCase() === name
      );
      
      if (duplicateGroup) {
        // Merge attributes from all versions
        agent.consolidatedFrom = duplicateGroup.duplicates.length + 1;
        agent.mergedAttributes = this.mergeAgentAttributes([
          duplicateGroup.primary,
          ...duplicateGroup.duplicates
        ]);
        
        this.consolidationLog.push({
          agent: agent.name,
          action: 'consolidated',
          versions: duplicateGroup.duplicates.length + 1,
          sources: [duplicateGroup.primary.source, ...duplicateGroup.duplicates.map(d => d.source)]
        });
      }
    }
  }

  mergeAgentAttributes(versions) {
    const merged = {
      descriptions: versions.map(v => v.description).filter(Boolean),
      jobs: versions.map(v => v.job).filter(Boolean),
      avatars: versions.map(v => v.avatar).filter(Boolean),
      sources: versions.map(v => v.source)
    };
    
    // Use the most complete description
    const bestDescription = merged.descriptions
      .sort((a, b) => b.length - a.length)[0];
    
    return {
      ...merged,
      bestDescription,
      uniqueJobs: [...new Set(merged.jobs)],
      uniqueAvatars: [...new Set(merged.avatars)]
    };
  }

  assignZodiacPersonalities() {
    for (const [name, agent] of this.uniqueAgents) {
      const agentName = agent.name;
      
      if (AGENT_BIRTHDAYS[agentName]) {
        const birthday = AGENT_BIRTHDAYS[agentName];
        const zodiacInfo = ZODIAC_PERSONALITIES[birthday.zodiac];
        
        // Assign meaningful personality
        agent.zodiac_sign = birthday.zodiac;
        agent.birthday = birthday.birthday;
        agent.age = birthday.age;
        agent.personality_traits = zodiacInfo.traits;
        agent.personality_description = zodiacInfo.description;
        agent.element = zodiacInfo.element;
        agent.season = zodiacInfo.season;
        
        // Add open door policy
        agent.open_door_policy = OPEN_DOOR_POLICY;
        
        console.log(`   🌟 ${agentName}: ${birthday.zodiac} (${zodiacInfo.description})`);
      } else {
        // Assign random zodiac for new agents
        const zodiacSigns = Object.keys(ZODIAC_PERSONALITIES);
        const randomZodiac = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
        const zodiacInfo = ZODIAC_PERSONALITIES[randomZodiac];
        
        agent.zodiac_sign = randomZodiac;
        agent.personality_traits = zodiacInfo.traits;
        agent.personality_description = zodiacInfo.description;
        agent.open_door_policy = OPEN_DOOR_POLICY;
        
        console.log(`   ✨ ${agentName}: ${randomZodiac} (newly assigned)`);
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalAgents: this.uniqueAgents.size,
      duplicatesFound: this.duplicates.length,
      agentsWithPersonalities: Array.from(this.uniqueAgents.values())
        .filter(a => a.zodiac_sign).length,
      consolidationActions: this.consolidationLog,
      
      uniqueAgentsByZodiac: {},
      agentsBySource: { Aurelius: 0, MMX: 0, Both: 0 }
    };
    
    // Group by zodiac
    for (const agent of this.uniqueAgents.values()) {
      if (agent.zodiac_sign) {
        if (!report.uniqueAgentsByZodiac[agent.zodiac_sign]) {
          report.uniqueAgentsByZodiac[agent.zodiac_sign] = [];
        }
        report.uniqueAgentsByZodiac[agent.zodiac_sign].push(agent.name);
      }
      
      // Count sources
      if (agent.consolidatedFrom > 1) {
        report.agentsBySource.Both++;
      } else if (agent.source === 'Aurelius') {
        report.agentsBySource.Aurelius++;
      } else {
        report.agentsBySource.MMX++;
      }
    }
    
    console.log('\n📊 CONSOLIDATION REPORT');
    console.log('========================');
    console.log(`✨ Total Unique Agents: ${report.totalAgents}`);
    console.log(`🔄 Duplicate Groups Resolved: ${report.duplicatesFound}`);
    console.log(`🌟 Agents with Personalities: ${report.agentsWithPersonalities}`);
    console.log(`🏛️ From Aurelius Only: ${report.agentsBySource.Aurelius}`);
    console.log(`⚙️ From MMX Only: ${report.agentsBySource.MMX}`);
    console.log(`🤝 Merged from Both: ${report.agentsBySource.Both}`);
    
    console.log('\n🌟 ZODIAC DISTRIBUTION:');
    for (const [zodiac, agents] of Object.entries(report.uniqueAgentsByZodiac)) {
      console.log(`   ${zodiac}: ${agents.join(', ')}`);
    }
    
    return report;
  }
}

// Main execution function
async function runMindfulConsolidation() {
  try {
    const aureliusUrl = 'https://owalnojeylnucvmkvqvo.supabase.co';
    const mmxUrl = 'https://wnacylxdwzoiygadarsd.supabase.co';
    
    // You'll need to provide service role keys
    console.log('🔑 Please provide service role keys to run consolidation');
    console.log('Usage: node consolidate-agents-mindfully.js <aurelius-key> <mmx-key>');
    
    if (process.argv.length >= 4) {
      const aureliusKey = process.argv[2];
      const mmxKey = process.argv[3];
      
      const consolidator = new MindfulAgentConsolidator(
        aureliusUrl, aureliusKey,
        mmxUrl, mmxKey
      );
      
      const consolidatedAgents = await consolidator.consolidateRespectfully();
      
      console.log('\n🎉 MINDFUL CONSOLIDATION COMPLETE!');
      console.log('Your agents now have meaningful personalities and zodiac signs.');
      console.log('Ready to build the holistic agent wellness system! 🌟');
      
      return consolidatedAgents;
    }
    
  } catch (error) {
    console.error('❌ Consolidation error:', error.message);
  }
}

// Export for use in other modules
export {
  MindfulAgentConsolidator,
  ZODIAC_PERSONALITIES,
  AGENT_BIRTHDAYS,
  OPEN_DOOR_POLICY
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMindfulConsolidation();
}
