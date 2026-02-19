/**
 * Test script for usage tracking API
 * 
 * Usage:
 * 1. Start the dev server: npm run dev
 * 2. Run this script: node test-usage-tracking.mjs
 */

const BASE_URL = 'http://localhost:3000';

// Replace with an actual prompt ID from your database
const TEST_PROMPT_ID = 'REPLACE_WITH_ACTUAL_PROMPT_ID';

async function testUsageTracking() {
  console.log('🧪 Testing Usage Tracking API\n');

  // Test 1: Track COPY action
  console.log('Test 1: Tracking COPY action...');
  try {
    const response = await fetch(`${BASE_URL}/api/prompts/${TEST_PROMPT_ID}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usageType: 'COPY'
      }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ COPY tracking successful\n');
    } else {
      console.log('❌ COPY tracking failed\n');
      console.log('Error details:', data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }

  // Test 2: Track DOWNLOAD action
  console.log('Test 2: Tracking DOWNLOAD action...');
  try {
    const response = await fetch(`${BASE_URL}/api/prompts/${TEST_PROMPT_ID}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usageType: 'DOWNLOAD'
      }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ DOWNLOAD tracking successful\n');
    } else {
      console.log('❌ DOWNLOAD tracking failed\n');
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }

  // Test 3: Track RUN action with platform
  console.log('Test 3: Tracking RUN action...');
  try {
    const response = await fetch(`${BASE_URL}/api/prompts/${TEST_PROMPT_ID}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usageType: 'RUN',
        platform: 'ChatGPT'
      }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ RUN tracking successful\n');
    } else {
      console.log('❌ RUN tracking failed\n');
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }

  // Test 4: Get usage metrics
  console.log('Test 4: Getting usage metrics...');
  try {
    const response = await fetch(`${BASE_URL}/api/prompts/${TEST_PROMPT_ID}/usage`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Metrics:', data);
    
    if (response.ok) {
      console.log('✅ Metrics retrieval successful\n');
    } else {
      console.log('❌ Metrics retrieval failed\n');
    }
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }

  console.log('\n📊 Summary:');
  console.log('If all tests passed, check your database:');
  console.log('  SELECT * FROM prompt_usage_logs ORDER BY "usedAt" DESC LIMIT 5;');
  console.log('  SELECT * FROM prompt_usage_metrics WHERE "promptId" = \'' + TEST_PROMPT_ID + '\';');
}

// Get a prompt ID from the database first
async function getTestPromptId() {
  console.log('🔍 Fetching a test prompt ID...\n');
  try {
    const response = await fetch(`${BASE_URL}/api/prompts?limit=1`);
    const data = await response.json();
    
    if (data.prompts && data.prompts.length > 0) {
      return data.prompts[0].id;
    }
  } catch (error) {
    console.log('Could not fetch prompt ID automatically.');
  }
  return null;
}

// Main execution
(async () => {
  let promptId = TEST_PROMPT_ID;
  
  if (promptId === 'REPLACE_WITH_ACTUAL_PROMPT_ID') {
    promptId = await getTestPromptId();
    
    if (!promptId) {
      console.log('❌ Please replace TEST_PROMPT_ID in the script with an actual prompt ID from your database.');
      console.log('\nTo get a prompt ID, run:');
      console.log('  psql $DATABASE_URL -c "SELECT id, title FROM prompts LIMIT 1;"');
      process.exit(1);
    }
  }
  
  console.log(`Using prompt ID: ${promptId}\n`);
  await testUsageTracking();
})();
