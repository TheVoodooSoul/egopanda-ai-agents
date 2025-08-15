import { createClient } from '@supabase/supabase-js'

// Minimax-Supabase Integration Client
class MinimaxSupabaseClient {
  constructor(supabaseUrl, supabaseAnonKey) {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey)
    this.user = null
  }

  // Initialize and check auth state
  async initialize() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error) throw error
      
      this.user = user
      console.log(user ? `Authenticated as ${user.email}` : 'Not authenticated')
      return { success: true, user }
    } catch (error) {
      console.error('Initialization failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Sign in user
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      this.user = data.user
      console.log(`Signed in as ${data.user.email}`)
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Sign in failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Sign up new user
  async signUp(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      })
      
      if (error) throw error
      
      console.log('Sign up successful. Check your email for confirmation.')
      return { success: true, data }
    } catch (error) {
      console.error('Sign up failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
      
      this.user = null
      console.log('Signed out successfully')
      return { success: true }
    } catch (error) {
      console.error('Sign out failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Send message to Minimax agent
  async sendMessage(prompt, options = {}) {
    if (!this.user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('minmax-agent-auth', {
        body: {
          prompt,
          options: {
            model: options.model || 'minmax-llama3.1-hybrid',
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 1024
          }
        }
      })

      if (error) throw error

      if (data.success && data.response && data.response.choices && data.response.choices[0]) {
        return {
          success: true,
          message: data.response.choices[0].message.content,
          usage: data.response.usage,
          model: data.response.model
        }
      } else {
        throw new Error('Invalid response format from Minimax API')
      }
    } catch (error) {
      console.error('Message sending failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Stream chat conversation
  async* chatStream(messages, options = {}) {
    if (!Array.isArray(messages)) {
      throw new Error('Messages must be an array')
    }

    for (const message of messages) {
      if (typeof message === 'string') {
        const result = await this.sendMessage(message, options)
        yield result
      } else {
        console.warn('Invalid message format, skipping:', message)
      }
    }
  }

  // Get user info
  getCurrentUser() {
    return this.user
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.user
  }
}

// Usage examples:
async function example() {
  // Initialize client
  const client = new MinimaxSupabaseClient(
    'https://owalnojeylnucvmkvqvo.supabase.co',
    '38687bb428633ab4513d15d3a753a3aa1af86f727f3daa44ba8004f4bb29add4'
  )

  // Initialize and check auth
  await client.initialize()

  // Sign in (or sign up)
  const signInResult = await client.signIn('user@example.com', 'password')
  if (!signInResult.success) {
    console.error('Authentication failed:', signInResult.error)
    return
  }

  // Send a message
  const response = await client.sendMessage('Hello, how are you today?')
  if (response.success) {
    console.log('Agent response:', response.message)
    console.log('Usage:', response.usage)
  } else {
    console.error('Message failed:', response.error)
  }

  // Send multiple messages
  const messages = [
    'What is the weather like?',
    'Tell me a joke',
    'Explain quantum computing'
  ]

  console.log('Sending multiple messages...')
  for await (const result of client.chatStream(messages)) {
    if (result.success) {
      console.log('Response:', result.message)
    } else {
      console.error('Error:', result.error)
    }
  }
}

export { MinimaxSupabaseClient }

// For Node.js usage:
// const client = new MinimaxSupabaseClient('your-url', 'your-key')
// example().catch(console.error)
