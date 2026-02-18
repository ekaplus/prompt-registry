import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🧪 Testing login functionality...\n');

  try {
    // Step 1: Get CSRF token
    console.log('1. Fetching CSRF token...');
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfCookies = csrfResponse.headers.raw()['set-cookie'] || [];
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    console.log('✅ CSRF token obtained:', csrfToken.substring(0, 20) + '...\n');

    // Step 2: Attempt login using signin endpoint
    console.log('2. Attempting login with credentials...');
    console.log('   Email: srinivasan@eka1.com');
    console.log('   Password: srinivasan\n');

    const loginResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookies.join('; '),
      },
      body: new URLSearchParams({
        email: 'srinivasan@eka1.com',
        password: 'srinivasan',
        csrfToken: csrfToken,
        callbackUrl: `${BASE_URL}/`,
        json: 'true'
      }),
      redirect: 'manual'
    });

    console.log('   Response status:', loginResponse.status);
    console.log('   Response status text:', loginResponse.statusText);

    // Check response
    if (loginResponse.status === 200 || loginResponse.status === 302) {
      console.log('✅ Login successful!\n');
      
      // Collect all cookies (from CSRF + login)
      const loginCookies = loginResponse.headers.raw()['set-cookie'] || [];
      const allCookies = [...csrfCookies, ...loginCookies];
      
      console.log('3. Verifying session...');
      
      const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: { 'Cookie': allCookies.join('; ') }
      });
      const sessionData = await sessionResponse.json();
      
      if (sessionData && sessionData.user) {
        console.log('✅ Session verified!');
        console.log('   User:', JSON.stringify(sessionData.user, null, 2));
        
        // Step 4: Test a protected endpoint
        console.log('\n4. Testing protected endpoint...');
        const protectedResponse = await fetch(`${BASE_URL}/api/user/notifications`, {
          headers: { 'Cookie': allCookies.join('; ') }
        });
        
        if (protectedResponse.ok) {
          console.log('✅ Protected endpoint accessible!');
          console.log('   Status:', protectedResponse.status);
        } else {
          console.log('❌ Protected endpoint failed');
          console.log('   Status:', protectedResponse.status);
        }
      } else {
        console.log('⚠️  No session found');
        console.log('   Response:', JSON.stringify(sessionData, null, 2));
      }
    } else {
      console.log('❌ Login failed!');
      const responseText = await loginResponse.text();
      console.log('   Response:', responseText.substring(0, 500));
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error.stack);
  }
}

testLogin();
