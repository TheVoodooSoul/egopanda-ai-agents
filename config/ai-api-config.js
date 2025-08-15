// Secure AI API Configuration for EgoPanda Creative Agents
// This configuration enables Charlie, Vanessa, and Auto to use generative AI capabilities

const AI_API_CONFIG = {
    // Primary API Key (Redacted in logs for security)
    apiKey: '2d95f02f-c42b-4c1a-887e-37e057e25af5:a85f0ebd91dbe6f53c1b6722d605cf5d',
    
    // API Service Configuration
    baseUrl: 'https://api.minimax.chat/v1',
    
    // Agent Access Control
    authorizedAgents: ['charlie', 'vanessa', 'auto'],
    
    // Capability Mappings
    agentCapabilities: {
        charlie: {
            name: 'Charlie',
            role: 'Content Creator',
            allowedCapabilities: [
                'text-to-image',      // Primary: Image generation for content
                'text-generation',    // Advanced content writing
                'voice-generation',   // Audio content creation
                'image-analysis'      // Content optimization
            ],
            maxRequestsPerDay: 100,
            priorityLevel: 'high'
        },
        vanessa: {
            name: 'Vanessa',
            role: 'Leadership',
            allowedCapabilities: [
                'workflow-automation', // Strategic process design
                'text-generation',     // Leadership communications
                'image-analysis',      // Strategic visual analysis
                'advanced-planning'    // Executive-level AI assistance
            ],
            maxRequestsPerDay: 150,
            priorityLevel: 'highest'
        },
        auto: {
            name: 'Auto',
            role: 'Business Operations',
            allowedCapabilities: [
                'workflow-automation', // Primary: Process automation
                'text-generation',     // Documentation and reports
                'image-to-video',      // Process visualization
                'system-integration'   // API and system connections
            ],
            maxRequestsPerDay: 200,
            priorityLevel: 'high'
        }
    },
    
    // API Endpoints
    endpoints: {
        'text-to-image': '/text_to_image',
        'image-to-video': '/video_generation', 
        'text-generation': '/chatcompletion_pro',
        'image-analysis': '/image_analysis',
        'voice-generation': '/speech_synthesis',
        'workflow-automation': '/function_calling'
    },
    
    // Request Configuration
    defaultParams: {
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
        stream: false
    },
    
    // Security Settings
    security: {
        encryptApiKey: true,
        logRequests: true,
        rateLimitEnabled: true,
        allowedOrigins: [
            'localhost',
            'vercel.app',
            'egopanda.creative'
        ]
    },
    
    // Task Value Metrics (for performance tracking integration)
    taskValueMetrics: {
        'text-to-image': { revenue: 150, timeSaved: 3, moneySaved: 200 },
        'image-to-video': { revenue: 300, timeSaved: 5, moneySaved: 400 },
        'text-generation': { revenue: 100, timeSaved: 2, moneySaved: 150 },
        'image-analysis': { revenue: 75, timeSaved: 1, moneySaved: 100 },
        'voice-generation': { revenue: 200, timeSaved: 4, moneySaved: 300 },
        'workflow-automation': { revenue: 500, timeSaved: 8, moneySaved: 600 }
    }
};

// Utility Functions
const AIUtils = {
    // Secure API key getter
    getApiKey() {
        return AI_API_CONFIG.apiKey;
    },
    
    // Check if agent has access to capability
    hasCapability(agentId, capability) {
        const agent = AI_API_CONFIG.agentCapabilities[agentId];
        return agent && agent.allowedCapabilities.includes(capability);
    },
    
    // Get agent's daily request limit
    getRequestLimit(agentId) {
        const agent = AI_API_CONFIG.agentCapabilities[agentId];
        return agent ? agent.maxRequestsPerDay : 0;
    },
    
    // Build API request headers
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.getApiKey()}`,
            'Content-Type': 'application/json',
            'X-Source': 'EgoPanda-Creative-Agents'
        };
    },
    
    // Build API endpoint URL
    buildEndpointUrl(capability) {
        const endpoint = AI_API_CONFIG.endpoints[capability];
        return endpoint ? `${AI_API_CONFIG.baseUrl}${endpoint}` : null;
    },
    
    // Get task value metrics for performance tracking
    getTaskMetrics(capability) {
        return AI_API_CONFIG.taskValueMetrics[capability] || 
               { revenue: 100, timeSaved: 2, moneySaved: 150 };
    },
    
    // Validate agent access
    validateAccess(agentId, capability) {
        if (!AI_API_CONFIG.authorizedAgents.includes(agentId)) {
            throw new Error(`Agent ${agentId} is not authorized for AI API access`);
        }
        
        if (!this.hasCapability(agentId, capability)) {
            throw new Error(`Agent ${agentId} does not have access to ${capability}`);
        }
        
        return true;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AI_API_CONFIG, AIUtils };
}

// Browser globals
if (typeof window !== 'undefined') {
    window.AI_API_CONFIG = AI_API_CONFIG;
    window.AIUtils = AIUtils;
}

console.log('🔐 AI API Configuration loaded for agents:', AI_API_CONFIG.authorizedAgents.join(', '));
