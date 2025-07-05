const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Extract Supabase URL from connection string
const connectionString = process.env.CONNECTION_STRING || '';
console.log('Raw CONNECTION_STRING:', connectionString);
const urlMatch = connectionString.match(/@db\.([^.]+)\.supabase\.co/);
const SUPABASE_URL = urlMatch ? `https://${urlMatch[1]}.supabase.co` : '';

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '***SET***' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '***SET***' : 'NOT SET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    
    // Test 1: Check if we can connect to the database
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful!');
    
    // Test 2: Check if tables exist
    console.log('\n🔍 Checking table structure...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
    }
    
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.error('❌ Chat messages table error:', messagesError.message);
    } else {
      console.log('✅ Chat messages table accessible');
    }
    
    // Test 3: Try to create a test user
    console.log('\n🔍 Testing user creation...');
    
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123'
    };
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ User creation failed:', createError.message);
    } else {
      console.log('✅ User creation successful:', newUser.id);
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('id', newUser.id);
      
      console.log('✅ Test user cleaned up');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testConnection(); 