// EgoPanda Creative - Production Configuration
export const PRODUCTION_CONFIG = {
    // Supabase Configuration (LIVE)
    SUPABASE: {
        URL: 'https://owalnojeylnucvmkvqvo.supabase.co',
        ANON_KEY: '38687bb428633ab4513d15d3a753a3aa1af86f727f3daa44ba8004f4bb29add4',
        // Note: Service role key should be in server-side environment only
    },
    
    // Square Payment Configuration (LIVE)
    SQUARE: {
        ENVIRONMENT: 'production',
        PAYMENT_LINKS: {
            SINGLE_AGENT: 'https://square.link/u/4XDDOghE',
            EXECUTIVE_TRIAL: 'https://square.link/u/iORIO9s', 
            FULL_SUITE_ANNUAL: 'https://square.link/u/swAJ1grE',
            EXECUTIVE_ANNUAL: 'https://square.link/u/MHuKoxUP',
            CUSTOM_LIFETIME: 'https://square.link/u/aocGgYQs'
        }
    },
    
    // Subscription Tiers (PRODUCTION)
    TIERS: {
        SINGLE_AGENT: {
            id: 'SINGLE_AGENT',
            name: 'Single Agent',
            price: 50,
            billingCycle: 'monthly',
            agents: 1,
            maxProjects: 5,
            allowedAgents: ['charlie'],
            features: ['Basic AI agent', 'Content creation', 'Email support']
        },
        EXECUTIVE_TRIAL: {
            id: 'EXECUTIVE_TRIAL',
            name: 'Executive Trial',
            price: 99.99,
            recurringPrice: 199,
            billingCycle: 'monthly',
            agents: 12,
            maxProjects: 50,
            allowedAgents: ['charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo'],
            features: ['12 core agents', 'Advanced workflows', 'Priority support']
        },
        FULL_SUITE_ANNUAL: {
            id: 'FULL_SUITE_ANNUAL',
            name: 'Full Suite Annual',
            price: 200,
            billingCycle: 'annual',
            agents: 18,
            maxProjects: -1, // unlimited
            allowedAgents: ['charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo', 'aurelius', 'nova', 'pixel', 'sage', 'flux', 'orbit'],
            features: ['All 18 agents', 'Custom agent creation', 'Premium support', 'Unlimited projects']
        },
        EXECUTIVE_ANNUAL: {
            id: 'EXECUTIVE_ANNUAL',
            name: 'Executive Annual',
            price: 1499.99,
            billingCycle: 'annual',
            agents: 18,
            maxProjects: -1, // unlimited
            allowedAgents: ['charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo', 'aurelius', 'nova', 'pixel', 'sage', 'flux', 'orbit'],
            features: ['All 18 premium agents', '24/7 executive support', 'Priority processing', 'Custom workflows']
        },
        CUSTOM_LIFETIME: {
            id: 'CUSTOM_LIFETIME',
            name: 'Custom Lifetime',
            price: 1999,
            billingCycle: 'lifetime',
            agents: 'custom',
            maxProjects: -1, // unlimited
            allowedAgents: ['aurelius'], // starts with agent creation
            features: ['Custom agent creation', 'Lifetime access', 'Premium support', 'Unlimited projects']
        }
    },
    
    // Production Settings
    APP: {
        ENVIRONMENT: 'production',
        DOMAIN: 'egopandacreative.com',
        SECURE_COOKIES: true,
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
        MAX_LOGIN_ATTEMPTS: 5,
        RATE_LIMIT: 100 // requests per minute
    },
    
    // Database Settings
    DATABASE: {
        CONNECTION_TIMEOUT: 30000,
        QUERY_TIMEOUT: 10000,
        MAX_CONNECTIONS: 20,
        SSL: true
    },
    
    // Security Settings
    SECURITY: {
        BCRYPT_ROUNDS: 12,
        JWT_EXPIRATION: '24h',
        CSRF_PROTECTION: true,
        HELMET_CONFIG: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
                    fontSrc: ["'self'", "fonts.gstatic.com"],
                    scriptSrc: ["'self'", "esm.sh"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "*.supabase.co", "api.minimax.chat"]
                }
            }
        }
    }
};

// Export configuration based on environment
export default PRODUCTION_CONFIG;
