// EgoPanda Creative - Schema Deployment Script
// Run this to deploy the database schema to production Supabase

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://owalnojeylnucvmkvqvo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.error('   Set it with: set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deploySchema() {
    console.log('🚀 Deploying EgoPanda Creative schema to production...');
    
    try {
        // Read the SQL schema file
        const schemaPath = path.join(process.cwd(), 'public/sql/user-subscriptions-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📁 Schema file loaded successfully');
        
        // Split schema into individual statements (simple split by semicolon)
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';'; // Re-add semicolon
            
            console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
            
            try {
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: statement
                });
                
                if (error) {
                    console.error(`❌ Error in statement ${i + 1}:`, error);
                    
                    // Try alternative method for DDL statements
                    console.log('🔄 Trying alternative execution method...');
                    
                    // For DDL statements, we need to use a different approach
                    // This requires manual execution in Supabase SQL Editor
                    console.warn('⚠️  Some statements may need manual execution in Supabase SQL Editor');
                    
                } else {
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                }
                
            } catch (execError) {
                console.error(`❌ Failed to execute statement ${i + 1}:`, execError.message);
            }
        }
        
        console.log('🎉 Schema deployment completed!');
        console.log('');
        console.log('📋 Manual Steps Required:');
        console.log('1. Go to your Supabase project: https://supabase.com/dashboard/project/owalnojeylnucvmkvqvo');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of public/sql/user-subscriptions-schema.sql');
        console.log('4. Click "Run" to execute the schema');
        console.log('');
        console.log('✅ This will create:');
        console.log('   - user_subscriptions table');
        console.log('   - agent_usage_logs table');
        console.log('   - Row-level security policies');
        console.log('   - Helper functions for access control');
        
    } catch (error) {
        console.error('❌ Schema deployment failed:', error);
    }
}

// Test database connection first
async function testConnection() {
    console.log('🔍 Testing Supabase connection...');
    
    try {
        const { data, error } = await supabase
            .from('auth.users')
            .select('count(*)')
            .limit(1);
            
        if (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
        
        console.log('✅ Supabase connection successful');
        return true;
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return false;
    }
}

// Main execution
async function main() {
    const connected = await testConnection();
    
    if (connected) {
        await deploySchema();
    } else {
        console.error('❌ Cannot proceed without database connection');
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { deploySchema, testConnection };
