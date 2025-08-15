# Project Consolidation Guide

## Current Situation
- **Target Project**: Aureluis_agents (main project)
- **Duplicate Project**: mmx-agent-1754811833013 (to be consolidated)
- **Third Project**: action_scen_ai (separate?)

## What We Need to Check in Aureluis_agents Dashboard

### 1. Database Tables
Go to: Dashboard → Table Editor
Look for these tables:
- `agents` - Contains your agent personalities/images
- `agent_conversations` - Chat history
- `conversation_messages` - Message storage
- `minimax_usage` - Usage tracking

### 2. Storage Buckets
Go to: Dashboard → Storage
Look for:
- Agent avatar images
- Any character images you uploaded

### 3. Edge Functions
Go to: Dashboard → Edge Functions
Look for:
- `minmax-agent-auth` or similar
- Any existing AI agent functions

### 4. Project Settings
Go to: Dashboard → Settings → General
Get these values:
- **Project URL**: `https://[PROJECT_REF].supabase.co`
- **Project Reference ID**: (the part before .supabase.co)
- **Anon Key**: From Settings → API

## What to Look For
Tell me what you see in each section so I can:
1. **Update this local project** to connect to Aureluis_agents
2. **Migrate any useful data** from the other project
3. **Fix the agent names/roles** to match your images
4. **Delete or deactivate** the duplicate project

## Agent Information Needed
When you find the agents table or images, tell me:
- **Agent names** (the actual character names)
- **Their job roles** (what each agent specializes in)
- **Personality types** (how they should behave)
- **Image URLs** (so we can match them properly)

This will ensure your distinct agents have the right names and roles attached to their images!
