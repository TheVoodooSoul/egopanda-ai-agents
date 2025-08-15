#!/usr/bin/env node

/**
 * Command-line Project Audit Tool
 * Run this to see your actual agent data from both projects
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Project credentials
const AURELIUS_URL = 'https://owalnojeylnucvmkvqvo.supabase.co';
const AURELIUS_KEY = '38687bb428633ab4513d15d3a753a3aa1af86f727f3daa44ba8004f4bb29add4';

const MMX_URL = 'https://wnacylxdwzoiygadarsd.supabase.co';
const MMX_KEY = '49a537fd69de53c9c84dce922ead2fc414a5e3ef4829b689e0d2a2b885f15132';

async function auditProject(name, url, key, email, password) {
    console.log(`\n🔍 === AUDITING ${name.toUpperCase()} PROJECT ===`);
    console.log(`URL: ${url}`);
    
    try {
        const supabase = createClient(url, key);
        
        // Authenticate first
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.log(`❌ Auth failed: ${authError.message}`);
            return { success: false, error: authError.message };
        }

        console.log(`✅ Authenticated successfully`);

        // Check for agents in various table names
        const tablesToCheck = ['agents', 'pandas', 'characters', 'ai_agents', 'panda_agents', 'profiles'];
        const projectData = { agents: [], tables: [] };

        for (const tableName of tablesToCheck) {
            try {
                const { data, error } = await supabase.from(tableName).select('*');
                
                if (!error && data && data.length > 0) {
                    console.log(`\n📊 Found table: ${tableName} (${data.length} records)`);
                    projectData.tables.push({ name: tableName, count: data.length });
                    
                    if (tableName.includes('agent') || tableName.includes('panda') || tableName.includes('character')) {
                        projectData.agents = projectData.agents.concat(data);
                    }
                }
            } catch (e) {
                // Table doesn't exist
            }
        }

        // Display agents found
        console.log(`\n🐼 AGENTS FOUND: ${projectData.agents.length}`);
        
        if (projectData.agents.length > 0) {
            console.log('\n--- AGENT DETAILS ---');
            projectData.agents.forEach((agent, i) => {
                const name = agent.name || agent.character_name || `Agent ${i + 1}`;
                const job = agent.job_title || agent.job || agent.role || 'No job';
                const personality = agent.personality_type || agent.personality || 'No personality';
                const zodiac = agent.zodiac_sign || 'No zodiac';
                
                console.log(`${i + 1}. 🐼 ${name}`);
                console.log(`   Job: ${job}`);
                console.log(`   Personality: ${personality}`);
                console.log(`   Zodiac: ${zodiac}`);
                if (agent.created_at) {
                    console.log(`   Created: ${new Date(agent.created_at).toLocaleDateString()}`);
                }
                console.log('');
            });
        } else {
            console.log('❌ No agents found in this project');
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
        return;
    }

    const aureliusAgents = aureliusData.agents || [];
    const mmxAgents = mmxData.agents || [];

    console.log(`\n🏛️  AURELIUS: ${aureliusAgents.length} agents`);
    console.log(`⚙️  MMX: ${mmxAgents.length} agents`);

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
    } else {
        console.log('⚖️  Projects have similar agent counts - choose based on data quality');
    }

    console.log(`📦 Need to consolidate ${duplicates.length} duplicates`);
    console.log(`📥 Need to migrate ${uniqueToAurelius.length + uniqueToMMX.length} unique agents`);
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Choose master project based on recommendations');
    console.log('2. Migrate unique agents from secondary project');
    console.log('3. Resolve duplicate agents (keep best version)');
    console.log('4. Deploy birthday system and enhanced frontend');
    console.log('5. Build tower background agency interface');
}

async function main() {
    console.log('🎯 AI AGENT PROJECT AUDIT');
    console.log('==========================\n');
    
    // Get credentials from user input
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
        console.log('Usage: node audit-cli.js <email> <password>');
        console.log('Example: node audit-cli.js your@email.com yourpassword');
        process.exit(1);
    }

    console.log(`📧 Using email: ${email}`);
    console.log(`🔐 Password: ${'*'.repeat(password.length)}`);

    // Audit both projects
    const aureliusData = await auditProject('AURELIUS', AURELIUS_URL, AURELIUS_KEY, email, password);
    const mmxData = await auditProject('MMX', MMX_URL, MMX_KEY, email, password);

    // Compare and provide recommendations
    await compareAndConsolidate(aureliusData, mmxData);

    console.log('\n🎉 AUDIT COMPLETE!');
    console.log('Your actual agent data is now visible.');
    console.log('Ready to build the professional agency interface with your real pandas! 🐼');
}

main().catch(console.error);
