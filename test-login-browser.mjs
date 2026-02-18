import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = join(__dirname, 'test-screenshots');

async function testLoginFlow() {
  console.log('🧪 Testing login flow with browser automation...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '01-login-page.png'), fullPage: true });
    console.log('✅ Screenshot saved: 01-login-page.png\n');

    // Step 2: Fill in credentials and submit
    console.log('2. Filling in login credentials...');
    console.log('   Email: srinivasan@eka1.com');
    console.log('   Password: srinivasan');
    
    await page.fill('input[name="email"]', 'srinivasan@eka1.com');
    await page.fill('input[name="password"]', 'srinivasan');
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '02-credentials-filled.png'), fullPage: true });
    console.log('✅ Screenshot saved: 02-credentials-filled.png\n');

    console.log('3. Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for any redirects
    
    const currentUrl = page.url();
    console.log('   Current URL after login:', currentUrl);
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '03-after-login.png'), fullPage: true });
    console.log('✅ Screenshot saved: 03-after-login.png\n');

    // Check if login was successful (not on login page anymore)
    if (currentUrl.includes('/login')) {
      console.log('❌ Login failed - still on login page');
      // Check for error messages
      const errorElement = await page.$('.error, [role="alert"], .text-red-500');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log('   Error message:', errorText);
      }
    } else {
      console.log('✅ Login successful - redirected to:', currentUrl);
    }

    // Step 4: Navigate to /feed
    console.log('\n4. Navigating to /feed to verify session persistence...');
    await page.goto(`${BASE_URL}/feed`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const feedUrl = page.url();
    console.log('   Current URL:', feedUrl);
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '04-feed-page.png'), fullPage: true });
    console.log('✅ Screenshot saved: 04-feed-page.png');
    
    if (feedUrl.includes('/login')) {
      console.log('❌ Session lost - redirected to login page');
    } else {
      console.log('✅ Session persists - on feed page');
    }

    // Step 5: Navigate to /collection
    console.log('\n5. Navigating to /collection to verify session still works...');
    await page.goto(`${BASE_URL}/collection`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const collectionUrl = page.url();
    console.log('   Current URL:', collectionUrl);
    
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '05-collection-page.png'), fullPage: true });
    console.log('✅ Screenshot saved: 05-collection-page.png');
    
    if (collectionUrl.includes('/login')) {
      console.log('❌ Session lost - redirected to login page');
    } else {
      console.log('✅ Session persists - on collection page');
    }

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('Login successful:', !currentUrl.includes('/login'));
    console.log('Feed page accessible:', !feedUrl.includes('/login'));
    console.log('Collection page accessible:', !collectionUrl.includes('/login'));
    console.log('Session maintained:', !feedUrl.includes('/login') && !collectionUrl.includes('/login'));
    console.log('\n📸 All screenshots saved to:', SCREENSHOTS_DIR);

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, 'error.png'), fullPage: true });
    console.log('Error screenshot saved: error.png');
  } finally {
    await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
} catch (err) {
  // Directory already exists
}

testLoginFlow();
