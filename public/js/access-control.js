// EgoPanda Creative - Access Control System
// Manages user subscription tiers and agent access

const SUBSCRIPTION_TIERS = {
    SINGLE_AGENT: {
        name: "Single Agent",
        price: 50,
        agents: 1,
        features: ['1 specialized AI agent', 'Basic support', '5 projects/month'],
        allowedAgents: ['charlie'], // Only Charlie for content creation
        maxProjects: 5,
        supportLevel: 'email',
        squareLink: 'https://square.link/u/4XDDOghE'
    },
    EXECUTIVE_TRIAL: {
        name: "Executive Trial", 
        price: 99.99,
        recurringPrice: 199,
        agents: 12,
        features: ['12 core agents', 'Priority support', 'Advanced workflows', '50 projects/month'],
        allowedAgents: ['charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo'],
        maxProjects: 50,
        supportLevel: 'priority',
        squareLink: 'https://square.link/u/iORIO9s'
    },
    FULL_SUITE_ANNUAL: {
        name: "Full Suite Annual",
        price: 200,
        billingType: 'annual',
        monthlyEquivalent: 16.67,
        agents: 18,
        features: ['All 18 agents', 'Premium support', 'Custom agent creation', 'Unlimited projects'],
        allowedAgents: ['charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo', 'aurelius', 'nova', 'pixel', 'sage', 'flux', 'orbit'],
        maxProjects: -1, // Unlimited
        supportLevel: 'premium',
        squareLink: 'https://square.link/u/swAJ1grE'
    },
    EXECUTIVE_ANNUAL: {
        name: "Executive Annual",
        price: 1499.99,
        billingType: 'annual',
        monthlyEquivalent: 125,
        agents: 18,
        features: ['All 18 premium agents', '24/7 executive support', 'Custom workflows', 'Unlimited projects', 'Priority processing'],
        allowedAgents: ['charlie', 'william', 'marsha', 'auto', 'rory', 'vanessa', 'tiki', 'sophia', 'zen', 'selina', 'titan', 'echo', 'aurelius', 'nova', 'pixel', 'sage', 'flux', 'orbit'],
        maxProjects: -1, // Unlimited
        supportLevel: 'executive',
        squareLink: 'https://square.link/u/MHuKoxUP'
    },
    CUSTOM_LIFETIME: {
        name: "Custom Agent Lifetime",
        price: 1999,
        billingType: 'lifetime',
        agents: 'custom',
        features: ['Custom AI agent creation', 'Lifetime access', 'Premium support', 'Unlimited projects'],
        allowedAgents: ['aurelius'], // Only agent creation initially, then custom agents
        maxProjects: -1, // Unlimited
        supportLevel: 'premium',
        squareLink: 'https://square.link/u/aocGgYQs'
    }
};

const AGENT_DETAILS = {
    charlie: { name: "Charlie", role: "Content Creator", category: "content" },
    william: { name: "William", role: "Web Developer", category: "development" },
    marsha: { name: "Marsha", role: "Marketing Specialist", category: "marketing" },
    auto: { name: "Auto", role: "Business Operations", category: "operations" },
    rory: { name: "Rory", role: "Research Analyst", category: "research" },
    vanessa: { name: "Vanessa", role: "Leadership Agent", category: "management" },
    tiki: { name: "Tiki", role: "Content Guardian", category: "content" },
    sophia: { name: "Sophia", role: "Content Strategist", category: "content" },
    zen: { name: "Zen", role: "UX Designer", category: "development" },
    selina: { name: "Selina", role: "Sales Diplomat", category: "marketing" },
    titan: { name: "Titan", role: "Operations Foundation", category: "operations" },
    echo: { name: "Echo", role: "Data Revolutionary", category: "research" },
    aurelius: { name: "Aurelius", role: "Master Agent Forge", category: "creation" },
    nova: { name: "Nova", role: "Innovation Catalyst", category: "strategy" },
    pixel: { name: "Pixel", role: "Visual Designer", category: "design" },
    sage: { name: "Sage", role: "Wisdom Keeper", category: "guidance" },
    flux: { name: "Flux", role: "Change Navigator", category: "transformation" },
    orbit: { name: "Orbit", role: "Systems Integrator", category: "technical" }
};

class AccessControl {
    constructor() {
        this.currentUser = this.getCurrentUser();
    }

    getCurrentUser() {
        // PRODUCTION: No demo mode - must have real authentication
        console.warn('❌ AccessControl.getCurrentUser() is deprecated. Use EgoPandaAuth instead.');
        return null;
    }

    setUserTier(tier) {
        this.currentUser.tier = tier;
        localStorage.setItem('egopanda_user', JSON.stringify(this.currentUser));
        this.refreshUI();
    }

    getUserTier() {
        return SUBSCRIPTION_TIERS[this.currentUser.tier];
    }

    hasAgentAccess(agentId) {
        const tier = this.getUserTier();
        return tier.allowedAgents.includes(agentId);
    }

    getAvailableAgents() {
        const tier = this.getUserTier();
        return tier.allowedAgents.map(agentId => ({
            id: agentId,
            ...AGENT_DETAILS[agentId]
        }));
    }

    getBlockedAgents() {
        const tier = this.getUserTier();
        const allAgents = Object.keys(AGENT_DETAILS);
        return allAgents
            .filter(agentId => !tier.allowedAgents.includes(agentId))
            .map(agentId => ({
                id: agentId,
                ...AGENT_DETAILS[agentId]
            }));
    }

    canStartNewProject() {
        const tier = this.getUserTier();
        if (tier.maxProjects === -1) return true; // Unlimited
        return this.currentUser.projectsUsed < tier.maxProjects;
    }

    startProject() {
        if (!this.canStartNewProject()) {
            throw new Error('Project limit reached for your subscription tier');
        }
        this.currentUser.projectsUsed++;
        localStorage.setItem('egopanda_user', JSON.stringify(this.currentUser));
    }

    getUpgradeMessage(targetAgentId) {
        const requiredTier = this.getRequiredTierForAgent(targetAgentId);
        const currentTier = this.getUserTier();
        
        return {
            message: `${AGENT_DETAILS[targetAgentId].name} requires ${requiredTier.name} subscription ($${requiredTier.price}/month)`,
            currentTier: currentTier.name,
            requiredTier: requiredTier.name,
            currentPrice: currentTier.price,
            requiredPrice: requiredTier.price,
            savings: requiredTier.price - currentTier.price
        };
    }

    getRequiredTierForAgent(agentId) {
        for (const [tierName, tierData] of Object.entries(SUBSCRIPTION_TIERS)) {
            if (tierData.allowedAgents.includes(agentId)) {
                return tierData;
            }
        }
        return SUBSCRIPTION_TIERS.ENTERPRISE; // Default to highest tier
    }

    refreshUI() {
        // Refresh the current page to reflect new access levels
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tierUpdated', {
                detail: { tier: this.getUserTier() }
            }));
        }
    }

    generateAccessReport() {
        const tier = this.getUserTier();
        const available = this.getAvailableAgents();
        const blocked = this.getBlockedAgents();
        
        return {
            user: this.currentUser,
            subscription: tier,
            access: {
                available: available,
                blocked: blocked,
                canCreateProjects: this.canStartNewProject(),
                projectsRemaining: tier.maxProjects === -1 ? 'Unlimited' : (tier.maxProjects - this.currentUser.projectsUsed)
            }
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AccessControl, SUBSCRIPTION_TIERS, AGENT_DETAILS };
} else {
    window.AccessControl = AccessControl;
    window.SUBSCRIPTION_TIERS = SUBSCRIPTION_TIERS;
    window.AGENT_DETAILS = AGENT_DETAILS;
}
