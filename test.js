import { MinimaxSupabaseClient } from './client.js'

// Test configuration - replace with your actual values
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123'

async function runTests() {
  console.log('🧪 Starting Minimax-Supabase Integration Tests\n')

  try {
    // Test 1: Initialize client
    console.log('1️⃣  Testing client initialization...')
    const client = new MinimaxSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    const initResult = await client.initialize()
    if (!initResult.success && initResult.error !== 'Invalid JWT') {
      throw new Error(`Initialization failed: ${initResult.error}`)
    }
    console.log('✅ Client initialized successfully')

    // Test 2: Authentication (skip if missing credentials)
    if (TEST_EMAIL === 'test@example.com' || TEST_PASSWORD === 'testpassword123') {
      console.log('⚠️  Skipping authentication tests - set TEST_EMAIL and TEST_PASSWORD environment variables')
    } else {
      console.log('2️⃣  Testing authentication...')
      
      const signInResult = await client.signIn(TEST_EMAIL, TEST_PASSWORD)
      if (!signInResult.success) {
        console.log('🔄 Sign in failed, attempting sign up...')
        const signUpResult = await client.signUp(TEST_EMAIL, TEST_PASSWORD)
        if (!signUpResult.success) {
          throw new Error(`Authentication failed: ${signUpResult.error}`)
        }
        console.log('✅ Sign up successful - check email for confirmation')
      } else {
        console.log('✅ Authentication successful')

        // Test 3: Send message (only if authenticated)
        console.log('3️⃣  Testing message sending...')
        const response = await client.sendMessage('Hello, this is a test message!')
        
        if (response.success) {
          console.log('✅ Message sent successfully')
          console.log('📨 Response:', response.message.substring(0, 100) + '...')
          console.log('📊 Tokens used:', response.usage?.total_tokens || 'unknown')
        } else {
          console.log('❌ Message sending failed:', response.error)
        }

        // Test 4: Test multiple messages
        console.log('4️⃣  Testing multiple messages...')
        const messages = ['What is AI?', 'Tell me about machine learning']
        
        let successCount = 0
        for await (const result of client.chatStream(messages)) {
          if (result.success) {
            successCount++
            console.log(`✅ Message ${successCount} successful`)
          } else {
            console.log(`❌ Message failed: ${result.error}`)
          }
        }

        // Test 5: Sign out
        console.log('5️⃣  Testing sign out...')
        const signOutResult = await client.signOut()
        if (signOutResult.success) {
          console.log('✅ Sign out successful')
        } else {
          console.log('❌ Sign out failed:', signOutResult.error)
        }
      }
    }

    console.log('\n🎉 All tests completed!')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Test environment check
function checkEnvironment() {
  console.log('🔍 Environment Check:')
  console.log('SUPABASE_URL:', SUPABASE_URL.substring(0, 30) + '...')
  console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 20) + '...')
  console.log('TEST_EMAIL:', TEST_EMAIL)
  console.log('TEST_PASSWORD:', '*'.repeat(TEST_PASSWORD.length))
  console.log('')

  if (SUPABASE_URL.includes('your-project-ref')) {
    console.log('⚠️  Please set your actual SUPABASE_URL')
  }
  if (SUPABASE_ANON_KEY.includes('your-anon-key')) {
    console.log('⚠️  Please set your actual SUPABASE_ANON_KEY')
  }
  console.log('')
}

// Run tests
checkEnvironment()
runTests().catch(console.error)

// Export for programmatic usage
export { runTests }
