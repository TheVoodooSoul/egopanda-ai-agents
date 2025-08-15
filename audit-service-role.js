#!/usr/bin/env node

/**
 * Service Role Project Audit Tool
 * For users who authenticate via GitHub
 */

import { createClient } from '@supabase/supabase-js';

// Project credentials
const AURELIUS_URL = 'https://owalnojeylnucvmkvqvo.supabase.co';
const AURELIUS_ANON_KEY = '38687bb428633ab4513d15d3a753a3aa1af86f727f3daa44ba8004f4bb29add4';

const MMX_URL = 'https://wnacylxdwzoiygadarsd.supabase.co';
const MMX_ANON_KEY = '49a537fd69de53c9c84dce922ead2fc414a5e3ef4829b689e0d2a2b885f15132';

async function auditProjectWithServiceRole(name, url, serviceKey) {
    console.log(`\n🔍 === AUDITING ${name.toUpperCase()} PROJECT ===`);
    console.log(`URL: ${url}`);
    console.log(`Using service role key: ${serviceKey.substring(0, 20)}...`);
    
    try {
        // Use service role key for full access
        const supabase = createClient(url, serviceKey);

        // Check for agents in various table names
        const tablesToCheck = ['agents', 'pandas', 'characters', 'ai_agents', 'panda_agents', 'profiles'];
        const projectData = { agents: [], tables: [] };

        console.log('\n📊 Checking tables...');

        for (const tableName of tablesToCheck) {
            try {
                const { data, error } = await supabase.from(tableName).select('*');
                
                if (!error && data && data.length > 0) {
                    console.log(`✅ Found table: ${tableName} (${data.length} records)`);
                    projectData.tables.push({ name: tableName, count: data.length });
                    
                    if (tableName.includes('agent') || tableName.includes('panda') || tableName.includes('character')) {
                        projectData.agents = projectData.agents.concat(data);
                        console.log(`   -> Added ${data.length} agents from ${tableName}`);
                    }
                } else if (error) {
                    console.log(`❌ Table ${tableName}: ${error.message}`);
                }
            } catch (e) {
                console.log(`⚠️  Table ${tableName}: ${e.message}`);
            }
        }

        // Display agents found
        console.log(`\n🐼 TOTAL AGENTS FOUND: ${projectData.agents.length}`);
        
        if (projectData.agents.length > 0) {
            console.log('\n=== YOUR ACTUAL PANDA AGENTS ===');
            projectData.agents.forEach((agent, i) => {
                const name = agent.name || agent.character_name || agent.display_name || `Agent ${i + 1}`;
                const job = agent.job_title || agent.job || agent.role || agent.profession || 'No job specified';
                const personality = agent.personality_type || agent.personality || agent.character_type || 'No personality';
                const zodiac = agent.zodiac_sign || agent.zodiac || 'No zodiac';
                const description = agent.description || agent.bio || '';
                
                console.log(`\n${i + 1}. 🐼 ${name}`);
                console.log(`   Job: ${job}`);
                console.log(`   Personality: ${personality}`);
                console.log(`   Zodiac: ${zodiac}`);
                if (description) {
                    console.log(`   Description: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`);
                }
                if (agent.created_at) {
                    console.log(`   Created: ${new Date(agent.created_at).toLocaleDateString()}`);
                }
                if (agent.avatar_url) {
                    console.log(`   Avatar: ${agent.avatar_url}`);
                }
            });
        } else {
            console.log('❌ No agents found in this project');
            console.log('💡 Try checking these tables manually in your dashboard:');
            projectData.tables.forEach(table => {
                console.log(`   - ${table.name} (${table.count} records)`);
            });
        }

        return { success: true, agents: projectData.agents, tables: projectData.tables };

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function compareAndConsolidate(aureliusData, mmxData) {
    console.log('\n📊 === CONSOLIDATION ANALYSIS ===');
    
    if (!aureliusData.success || !mmxData.success) {
        console.log('⚠️  Cannot compare - one or both audits failed');
        
        if (aureliusData.success && aureliusData.agents.length > 0) {
            console.log('\n✅ AURELIUS has agent data - use this as your master project');
        }
        if (mmxData.success && mmxData.agents.length > 0) {
            console.log('\n✅ MMX has agent data - consider this for consolidation');
        }
        return;
    }

    const aureliusAgents = aureliusData.agents || [];
    const mmxAgents = mmxData.agents || [];

    console.log(`\n🏛️  AURELIUS: ${aureliusAgents.length} agents`);
    console.log(`⚙️  MMX: ${mmxAgents.length} agents`);

    if (aureliusAgents.length === 0 && mmxAgents.length === 0) {
        console.log('\n❌ No agents found in either project!');
        console.log('🔍 Check your service role keys and table permissions');
        return;
    }

    // Find duplicates by name
    const aureliusNames = aureliusAgents.map(a => (a.name || a.character_name || '').toLowerCase().trim());
    const mmxNames = mmxAgents.map(a => (a.name || a.character_name || '').toLowerCase().trim());

    const duplicates = [];
    const uniqueToAurelius = [];
    const uniqueToMMX = [];

    aureliusAgents.forEach(agent => {
        const name = (agent.name || agent.character_name || '').toLowerCase().trim();
        if (mmxNames.includes(name)) {
            duplicates.push(name);
        } else {
            uniqueToAurelius.push(agent);
        }
    });

    mmxAgents.forEach(agent => {
        const name = (agent.name || agent.character_name || '').toLowerCase().trim();
        if (!aureliusNames.includes(name)) {
            uniqueToMMX.push(agent);
        }
    });

    console.log(`\n🔄 DUPLICATES: ${duplicates.length}`);
    if (duplicates.length > 0) {
        console.log(`   ${duplicates.join(', ')}`);
    }

    console.log(`\n🏛️  UNIQUE TO AURELIUS: ${uniqueToAurelius.length}`);
    console.log(`⚙️  UNIQUE TO MMX: ${uniqueToMMX.length}`);

    console.log('\n🎯 RECOMMENDATIONS:');
    if (aureliusAgents.length > mmxAgents.length) {
        console.log('✅ Use AURELIUS as the master project (has more agents)');
    } else if (mmxAgents.length > aureliusAgents.length) {
        console.log('✅ Use MMX as the master project (has more agents)');
    } else if (aureliusAgents.length > 0) {
        console.log('⚖️  Projects have similar agent counts - use the one with better data quality');
    }

    if (duplicates.length > 0) {
        console.log(`🔄 Need to consolidate ${duplicates.length} duplicates`);
    }
    if (uniqueToAurelius.length + uniqueToMMX.length > 0) {
        console.log(`📥 Need to migrate ${uniqueToAurelius.length + uniqueToMMX.length} unique agents`);
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Choose master project based on recommendations above');
    console.log('2. Deploy the birthday system database schema');
    console.log('3. Build tower background agency interface with these agents');
    console.log('4. Set up agent birthday celebrations');
    console.log('5. Launch your AI collaboration platform!');
}

async function main() {
    console.log('🎯 AI AGENT PROJECT AUDIT');
    console.log('🔑 Using Service Role Authentication');
    console.log('==================================\n');
    
    // Get service role keys from command line
    const aureliusServiceKey = process.argv[2];
    const mmxServiceKey = process.argv[3];
    
    if (!aureliusServiceKey) {
        console.log('Usage: node audit-service-role.js <aurelius_service_key> [mmx_service_key]');
        console.log('');
        console.log('Get your service role key from:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Select your project');
        console.log('3. Go to Settings -> API');
        console.log('4. Copy the "service_role" key (the longer one)');
        console.log('');
        console.log('Example:');
        console.log('node audit-service-role.js eyJhbGci...your_aurelius_service_key [eyJhbGci...your_mmx_service_key]');
        process.exit(1);
    }

    console.log(`🏛️  Aurelius service key: ${aureliusServiceKey.substring(0, 20)}...`);
    if (mmxServiceKey) {
        console.log(`⚙️  MMX service key: ${mmxServiceKey.substring(0, 20)}...`);
    } else {
        console.log('⚙️  MMX service key: Not provided (will skip MMX audit)');
    }

    // Audit projects
    const aureliusData = await auditProjectWithServiceRole('AURELIUS', AURELIUS_URL, aureliusServiceKey);
    
    let mmxData = { success: false, agents: [], tables: [] };
    if (mmxServiceKey) {
        mmxData = await auditProjectWithServiceRole('MMX', MMX_URL, mmxServiceKey);
    }

    // Compare and provide recommendations
    await compareAndConsolidate(aureliusData, mmxData);

    console.log('\n🎉 AUDIT COMPLETE!');
    console.log('Your actual agent data is now visible.');
    console.log('Ready to build the professional agency interface with your real pandas! 🐼');
}

main().catch(console.error);
