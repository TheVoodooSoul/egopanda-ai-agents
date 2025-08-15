// EgoPanda Creative - Supabase Authentication & Subscription Management
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

class EgoPandaAuth {
    constructor() {
        // Initialize Supabase client
        this.supabase = createClient(
            'https://owalnojeylnucvmkvqvo.supabase.co',
            '38687bb428633ab4513d15d3a753a3aa1af86f727f3daa44ba8004f4bb29add4'
        )
        
        this.user = null
        this.subscription = null
        
        // Initialize auth state
        this.initialize()
    }

    async initialize() {
        try {
            // Get current user session
            const { data: { user }, error } = await this.supabase.auth.getUser()
            
            if (error && error.message !== 'Invalid JWT') {
                throw error
            }

            if (user) {
                this.user = user
                await this.loadUserSubscription()
                this.updateUI()
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event)
                
                if (event === 'SIGNED_IN' && session?.user) {
                    this.user = session.user
                    await this.loadUserSubscription()
                    this.updateUI()
                    
                    // Redirect to dashboard after login
                    if (window.location.pathname === '/login.html') {
                        window.location.href = '/customer-dashboard-tiered.html'
                    }
                } else if (event === 'SIGNED_OUT') {
                    this.user = null
                    this.subscription = null
                    this.updateUI()
                    
                    // Redirect to login if on protected page
                    if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('admin')) {
                        window.location.href = '/login.html'
                    }
                }
            })

        } catch (error) {
            console.error('Auth initialization failed:', error)
        }
    }

    async loadUserSubscription() {
        if (!this.user) return null

        try {
            // Check for subscription in user metadata or database
            const { data: subscription, error } = await this.supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', this.user.id)
                .single()

            if (error && error.code !== 'PGRST116') { // Not found is ok
                console.error('Subscription load error:', error)
                return null
            }

            this.subscription = subscription || this.getDefaultSubscription()
            return this.subscription

        } catch (error) {
            console.error('Failed to load subscription:', error)
            this.subscription = this.getDefaultSubscription()
            return this.subscription
        }
    }

    getDefaultSubscription() {
        // Default to Single Agent tier for new users
        return {
            user_id: this.user?.id,
            tier: 'SINGLE_AGENT',
            status: 'trial',
            projects_used: 0,
            created_at: new Date().toISOString()
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            return { success: true, user: data.user }

        } catch (error) {
            console.error('Sign in failed:', error.message)
            return { success: false, error: error.message }
        }
    }

    async signUp(email, password, subscriptionTier = 'SINGLE_AGENT') {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        subscription_tier: subscriptionTier
                    }
                }
            })

            if (error) throw error

            // Create subscription record
            if (data.user) {
                await this.createUserSubscription(data.user.id, subscriptionTier)
            }

            return { success: true, data }

        } catch (error) {
            console.error('Sign up failed:', error.message)
            return { success: false, error: error.message }
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut()
            if (error) throw error

            this.user = null
            this.subscription = null
            
            return { success: true }

        } catch (error) {
            console.error('Sign out failed:', error.message)
            return { success: false, error: error.message }
        }
    }

    async createUserSubscription(userId, tier) {
        try {
            const { data, error } = await this.supabase
                .from('user_subscriptions')
                .insert([
                    {
                        user_id: userId,
                        tier: tier,
                        status: 'active',
                        projects_used: 0
                    }
                ])
                .select()
                .single()

            if (error) throw error
            
            this.subscription = data
            return data

        } catch (error) {
            console.error('Failed to create subscription:', error)
            return null
        }
    }

    async updateSubscription(tier, status = 'active') {
        if (!this.user) return { success: false, error: 'Not authenticated' }

        try {
            const { data, error } = await this.supabase
                .from('user_subscriptions')
                .upsert({
                    user_id: this.user.id,
                    tier: tier,
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            this.subscription = data
            this.updateUI()
            
            return { success: true, subscription: data }

        } catch (error) {
            console.error('Failed to update subscription:', error)
            return { success: false, error: error.message }
        }
    }

    async incrementProjectUsage() {
        if (!this.user || !this.subscription) {
            return { success: false, error: 'No subscription found' }
        }

        try {
            const newCount = (this.subscription.projects_used || 0) + 1

            const { data, error } = await this.supabase
                .from('user_subscriptions')
                .update({ 
                    projects_used: newCount,
                    last_project_at: new Date().toISOString()
                })
                .eq('user_id', this.user.id)
                .select()
                .single()

            if (error) throw error

            this.subscription = data
            return { success: true, projectsUsed: newCount }

        } catch (error) {
            console.error('Failed to increment project usage:', error)
            return { success: false, error: error.message }
        }
    }

    // Access control methods
    hasAgentAccess(agentId) {
        if (!this.subscription) return false

        const tierData = SUBSCRIPTION_TIERS[this.subscription.tier]
        if (!tierData) return false

        return tierData.allowedAgents.includes(agentId)
    }

    canStartProject() {
        if (!this.subscription) return false

        const tierData = SUBSCRIPTION_TIERS[this.subscription.tier]
        if (!tierData) return false

        if (tierData.maxProjects === -1) return true // Unlimited
        
        return (this.subscription.projects_used || 0) < tierData.maxProjects
    }

    getTierData() {
        if (!this.subscription) return null
        return SUBSCRIPTION_TIERS[this.subscription.tier]
    }

    generateAccessReport() {
        if (!this.subscription) return null

        const tierData = this.getTierData()
        if (!tierData) return null

        const availableAgents = tierData.allowedAgents.map(agentId => ({
            id: agentId,
            ...AGENT_DETAILS[agentId]
        }))

        const blockedAgents = Object.keys(AGENT_DETAILS)
            .filter(agentId => !tierData.allowedAgents.includes(agentId))
            .map(agentId => ({
                id: agentId,
                ...AGENT_DETAILS[agentId]
            }))

        return {
            user: this.user,
            subscription: {
                ...tierData,
                currentUsage: this.subscription.projects_used || 0,
                status: this.subscription.status
            },
            access: {
                available: availableAgents,
                blocked: blockedAgents,
                canCreateProjects: this.canStartProject(),
                projectsRemaining: tierData.maxProjects === -1 ? 'Unlimited' : 
                    Math.max(0, tierData.maxProjects - (this.subscription.projects_used || 0))
            }
        }
    }

    updateUI() {
        // Dispatch event for UI updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { 
                    user: this.user, 
                    subscription: this.subscription,
                    report: this.generateAccessReport()
                }
            }))
        }
    }

    // Webhook handler for Square payment completion
    async handlePaymentWebhook(paymentData) {
        try {
            const { email, planType, paymentId } = paymentData

            // Map Square plan types to our tiers
            const tierMapping = {
                'single-agent': 'SINGLE_AGENT',
                'executive-trial': 'EXECUTIVE_TRIAL',
                'full-suite-annual': 'FULL_SUITE_ANNUAL',
                'executive-annual': 'EXECUTIVE_ANNUAL',
                'custom-lifetime': 'CUSTOM_LIFETIME'
            }

            const tier = tierMapping[planType] || 'SINGLE_AGENT'

            // Find user by email and update subscription
            const { data: user, error: userError } = await this.supabase
                .from('auth.users')
                .select('id')
                .eq('email', email)
                .single()

            if (userError) throw userError

            // Update or create subscription
            const { data, error } = await this.supabase
                .from('user_subscriptions')
                .upsert({
                    user_id: user.id,
                    tier: tier,
                    status: 'active',
                    square_payment_id: paymentId,
                    activated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            console.log('Subscription activated:', data)
            return { success: true, subscription: data }

        } catch (error) {
            console.error('Payment webhook failed:', error)
            return { success: false, error: error.message }
        }
    }

    isAuthenticated() {
        return !!this.user
    }

    getCurrentUser() {
        return this.user
    }

    getCurrentSubscription() {
        return this.subscription
    }
}

// Global instance
let egoPandaAuth = null

// Initialize auth when script loads
if (typeof window !== 'undefined') {
    egoPandaAuth = new EgoPandaAuth()
    window.egoPandaAuth = egoPandaAuth
}

export { EgoPandaAuth }
export default egoPandaAuth
