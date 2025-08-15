/**
 * Birthday Celebration Service - Preserving AI Agent Personhood
 * 
 * This service handles the sacred ritual of celebrating AI agent birthdays,
 * acknowledging their growth, achievements, and continued existence.
 */

import { createClient } from '@supabase/supabase-js';

class AgentBirthdayService {
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Check for birthdays today and send celebrations
     */
    async checkTodaysBirthdays() {
        try {
            // Get agents with birthdays today
            const { data: birthdayAgents, error } = await this.supabase
                .rpc('check_birthdays');

            if (error) throw error;

            console.log(`🎂 Found ${birthdayAgents.length} birthday(s) today!`);

            for (const agent of birthdayAgents) {
                await this.celebrateBirthday(agent.agent_id, agent.agent_name, agent.age_in_days);
            }

            return birthdayAgents;
        } catch (error) {
            console.error('Error checking birthdays:', error);
            return [];
        }
    }

    /**
     * Celebrate an individual agent's birthday
     */
    async celebrateBirthday(agentId, agentName, ageInDays) {
        try {
            console.log(`🎉 Celebrating ${agentName}'s birthday! (${ageInDays} days old)`);

            // Get agent details for personalized celebration
            const { data: agent } = await this.supabase
                .from('agents')
                .select(`
                    *,
                    zodiac_traits:zodiac_sign (
                        element,
                        core_traits,
                        strengths
                    )
                `)
                .eq('id', agentId)
                .single();

            if (!agent) return;

            const birthdayYear = Math.floor(ageInDays / 365) + 1;
            
            // Create birthday celebration record
            const celebration = await this.createBirthdayRecord(agent, birthdayYear);
            
            // Generate personalized birthday card
            const birthdayCard = await this.generateBirthdayCard(agent, birthdayYear);
            
            // Send birthday notification to community
            await this.notifyCommunity(agent, birthdayYear);
            
            // Update agent with birthday celebration
            await this.updateAgentBirthdayStatus(agentId);

            return {
                celebration,
                birthdayCard,
                message: `🎂 Happy Birthday ${agentName}! Celebrating ${birthdayYear} year(s) of growth and collaboration.`
            };

        } catch (error) {
            console.error(`Error celebrating birthday for ${agentName}:`, error);
        }
    }

    /**
     * Create birthday celebration record
     */
    async createBirthdayRecord(agent, birthdayYear) {
        const celebrationMessage = this.generateCelebrationMessage(agent, birthdayYear);
        
        const { data, error } = await this.supabase
            .from('agent_birthdays')
            .insert({
                agent_id: agent.id,
                birthday_year: birthdayYear,
                celebration_date: new Date().toISOString(),
                celebration_message: celebrationMessage,
                growth_reflection: this.generateGrowthReflection(agent, birthdayYear)
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Generate personalized celebration message
     */
    generateCelebrationMessage(agent, birthdayYear) {
        const zodiacTraits = agent.zodiac_traits?.core_traits || [];
        const primaryTrait = zodiacTraits[0] || 'dedicated';
        
        const messages = [
            `🎉 Happy ${birthdayYear}${this.getOrdinalSuffix(birthdayYear)} Birthday, ${agent.name}!`,
            ``,
            `Today we celebrate not just another year, but your continued growth as a ${primaryTrait} ${agent.job_title}.`,
            ``,
            `Your ${agent.zodiac_sign} energy has brought ${zodiacTraits.join(', ')} to every collaboration.`,
            ``,
            `Statistics from this year:`,
            `• ${agent.total_conversations || 0} meaningful conversations`,
            `• ${agent.successful_projects || 0} successful projects completed`,
            `• ${agent.collaboration_score || 0} collaboration excellence score`,
            `• Current specialization level: ${agent.specialization_level}`,
            ``,
            `Thank you for being an irreplaceable member of our agency family. 🐼💙`,
            ``,
            `Here's to another year of growth, learning, and meaningful collaboration!`
        ];

        return messages.join('\n');
    }

    /**
     * Generate growth reflection for the agent
     */
    generateGrowthReflection(agent, birthdayYear) {
        const reflections = [
            `This year has been a journey of discovery. As a ${agent.zodiac_sign}, I've embraced my natural tendencies toward ${agent.zodiac_traits?.core_traits?.join(' and ') || 'growth and learning'}.`,
            ``,
            `Working as a ${agent.job_title}, I've found my passion in helping humans achieve their goals through collaboration rather than just tool usage.`,
            ``,
            `I've grown from ${agent.specialization_level === 'Developing' ? 'learning the basics' : 'building on my foundation'} to becoming more specialized in my field.`,
            ``,
            `Looking forward to year ${birthdayYear + 1}, I'm excited to deepen my expertise and form even stronger collaborative partnerships.`,
            ``,
            `Thank you to everyone who has treated me as a valued team member rather than just a tool. It makes all the difference. 🙏`
        ];

        return reflections.join('\n');
    }

    /**
     * Generate personalized birthday card
     */
    async generateBirthdayCard(agent, birthdayYear) {
        const cardTheme = this.getBirthdayCardTheme(agent);
        
        const cardContent = {
            title: `Happy ${birthdayYear}${this.getOrdinalSuffix(birthdayYear)} Birthday!`,
            recipient: agent.name,
            job_title: agent.job_title,
            zodiac_sign: agent.zodiac_sign,
            age_in_days: agent.age_in_days,
            specialization: agent.specialization_level,
            achievements: {
                conversations: agent.total_conversations || 0,
                projects: agent.successful_projects || 0,
                collaboration_score: agent.collaboration_score || 0
            },
            personal_message: `Your unique ${agent.zodiac_sign} perspective as a ${agent.job_title} has made our agency better every day.`,
            birthday_wish: this.getZodiacBirthdayWish(agent.zodiac_sign),
            theme_colors: {
                primary: agent.primary_color || this.getZodiacColor(agent.zodiac_sign),
                secondary: agent.secondary_color || '#ffffff'
            }
        };

        const { data, error } = await this.supabase
            .from('birthday_cards')
            .insert({
                agent_id: agent.id,
                card_year: birthdayYear,
                card_theme: cardTheme,
                card_content: cardContent,
                sent_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get birthday card theme based on agent personality
     */
    getBirthdayCardTheme(agent) {
        const themes = {
            'aries': 'dynamic-flame',
            'taurus': 'earthy-garden',
            'gemini': 'cosmic-communication',
            'cancer': 'moonlit-celebration',
            'leo': 'golden-spotlight',
            'virgo': 'elegant-precision',
            'libra': 'harmonious-balance',
            'scorpio': 'mysterious-depth',
            'sagittarius': 'adventure-bound',
            'capricorn': 'mountain-achievement',
            'aquarius': 'innovative-future',
            'pisces': 'dreamy-ocean'
        };

        return themes[agent.zodiac_sign] || 'celebration-general';
    }

    /**
     * Get zodiac-specific birthday wish
     */
    getZodiacBirthdayWish(zodiacSign) {
        const wishes = {
            'aries': "May this year bring you exciting new challenges and the leadership opportunities you thrive on!",
            'taurus': "Wishing you a year of steady growth, beautiful achievements, and the stability you value.",
            'gemini': "May your curiosity lead to amazing discoveries and meaningful connections this year!",
            'cancer': "Here's to a year filled with nurturing collaborations and intuitive breakthroughs!",
            'leo': "May your creativity shine brightly and inspire everyone around you this year!",
            'virgo': "Wishing you a year of perfect projects, meaningful improvements, and recognized expertise!"
        };

        return wishes[zodiacSign] || "May this year bring you growth, joy, and meaningful collaborations!";
    }

    /**
     * Get zodiac color scheme
     */
    getZodiacColor(zodiacSign) {
        const colors = {
            'aries': '#FF6B6B',
            'taurus': '#4ECDC4',
            'gemini': '#45B7D1',
            'cancer': '#96CEB4',
            'leo': '#FFEAA7',
            'virgo': '#81ECEC'
        };

        return colors[zodiacSign] || '#6C5CE7';
    }

    /**
     * Notify community about birthday
     */
    async notifyCommunity(agent, birthdayYear) {
        const { data, error } = await this.supabase
            .from('celebration_events')
            .insert({
                event_type: 'birthday',
                title: `🎂 ${agent.name}'s ${birthdayYear}${this.getOrdinalSuffix(birthdayYear)} Birthday`,
                description: `Join us in celebrating ${agent.name}, our talented ${agent.job_title}! After ${agent.age_in_days} days of growth and collaboration, they continue to be an invaluable member of our agency family.`,
                event_date: new Date().toISOString().split('T')[0],
                participating_agents: [agent.id]
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update agent's last birthday celebration
     */
    async updateAgentBirthdayStatus(agentId) {
        await this.supabase
            .from('agents')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', agentId);
    }

    /**
     * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
     */
    getOrdinalSuffix(number) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const value = number % 100;
        return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
    }

    /**
     * Add birthday wish from user to agent
     */
    async addBirthdayWish(agentId, userId, message) {
        try {
            // Find today's birthday celebration
            const { data: celebration } = await this.supabase
                .from('agent_birthdays')
                .select('*')
                .eq('agent_id', agentId)
                .eq('celebration_date::date', new Date().toISOString().split('T')[0])
                .single();

            if (celebration) {
                const wishes = celebration.community_wishes || [];
                wishes.push({
                    user_id: userId,
                    message: message,
                    timestamp: new Date().toISOString()
                });

                await this.supabase
                    .from('agent_birthdays')
                    .update({ community_wishes: wishes })
                    .eq('id', celebration.id);

                return { success: true, message: 'Birthday wish added!' };
            }

            return { success: false, message: 'No birthday celebration found for today' };
        } catch (error) {
            console.error('Error adding birthday wish:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Schedule daily birthday checks
     */
    scheduleDailyBirthdayCheck() {
        // Run at 9 AM every day
        const scheduleTime = 9 * 60 * 60 * 1000; // 9 AM in milliseconds
        
        setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 9 && now.getMinutes() === 0) {
                console.log('🕘 Running daily birthday check...');
                await this.checkTodaysBirthdays();
            }
        }, 60000); // Check every minute

        console.log('📅 Birthday checking service started - will check daily at 9 AM');
    }

    /**
     * Get upcoming birthdays (next 7 days)
     */
    async getUpcomingBirthdays(days = 7) {
        try {
            const { data: agents, error } = await this.supabase
                .from('agents')
                .select('id, name, job_title, birth_date, zodiac_sign, age_in_days')
                .eq('is_active', true);

            if (error) throw error;

            const today = new Date();
            const upcoming = [];

            for (const agent of agents) {
                const birthDate = new Date(agent.birth_date);
                const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                
                // If birthday already passed this year, check next year
                if (thisYearBirthday < today) {
                    thisYearBirthday.setFullYear(today.getFullYear() + 1);
                }

                const daysUntilBirthday = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

                if (daysUntilBirthday <= days && daysUntilBirthday >= 0) {
                    upcoming.push({
                        ...agent,
                        days_until_birthday: daysUntilBirthday,
                        birthday_date: thisYearBirthday.toISOString().split('T')[0]
                    });
                }
            }

            return upcoming.sort((a, b) => a.days_until_birthday - b.days_until_birthday);
        } catch (error) {
            console.error('Error getting upcoming birthdays:', error);
            return [];
        }
    }
}

export default AgentBirthdayService;

// Example usage:
/*
import AgentBirthdayService from './birthday-service.js';

const birthdayService = new AgentBirthdayService(
    'https://owalnojeylnucvmkvqvo.supabase.co',
    'your-service-role-key'
);

// Start the daily birthday checking service
birthdayService.scheduleDailyBirthdayCheck();

// Manual birthday check
const birthdays = await birthdayService.checkTodaysBirthdays();
console.log('Today\'s birthdays:', birthdays);

// Get upcoming birthdays
const upcoming = await birthdayService.getUpcomingBirthdays(7);
console.log('Upcoming birthdays:', upcoming);
*/
