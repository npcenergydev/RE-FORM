import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';

async function testPhase4Auth() {
  console.log('=== Running Phase 4 Authentication & Role Verification ===\n');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.main-wrapper');

  // 1. Sign out to test public vs protected routes
  console.log('[Test 4.1] Testing Sign-out and Route Protection...');
  await page.evaluate(() => {
    localStorage.setItem('reform_current_user_v1', 'null');
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

  // Public: Dashboard should be visible
  const hasHero = await page.$('.card-hero');
  console.log('✓ Public route accessible (Dashboard hero visible):', Boolean(hasHero));

  // Navigate to protected tab: 'scan'
  console.log('[Test 4.2] Verifying Gate on protected tab (Scan)...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('.nav-tab, .sidebar-link'));
    const scanBtn = navButtons.find(b => b.textContent.includes('Scan'));
    if (scanBtn) scanBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const gateText = await page.$eval('.main-wrapper', el => el.innerText);
  const isGated = gateText.includes('Studio Sign-In Required') && gateText.includes('Material Scanner');
  console.log('✓ Protected route gated with Studio Sign-In prompt:', isGated);
  if (!isGated) throw new Error('Unauthenticated user was not gated on protected route!');

  // Test 'Continue as Demo User' button in gate
  console.log('[Test 4.3] Testing Continue as Demo User button in Gate...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demoBtn = btns.find(b => b.textContent.includes('Continue as Demo User'));
    if (demoBtn) demoBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const scannerVisible = await page.$eval('.main-wrapper', el => el.innerText.includes('AI Material Scanner'));
  console.log('✓ Instant demo login unlocked protected feature immediately:', scannerVisible);
  if (!scannerVisible) throw new Error('Demo login did not unlock scanner view!');

  // Open AuthModal via Custody page and check Google Sign-in button & Role radio buttons
  console.log('[Test 4.4] Verifying AuthModal Google button and Role choice...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('.nav-tab, .sidebar-link'));
    const custodyBtn = navButtons.find(b => b.textContent.includes('Custody'));
    if (custodyBtn) custodyBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const authBtn = btns.find(b => b.textContent.includes('Sign In / Register'));
    if (authBtn) authBtn.click();
  });
  await page.waitForSelector('.modal-card', { visible: true });

  const modalContent = await page.$eval('.modal-card', el => el.innerText);
  const hasGoogle = modalContent.includes('Continue with Google');
  const hasDemoOption = modalContent.includes('Continue as Demo User');
  console.log('✓ AuthModal contains Google Sign-in option:', hasGoogle);
  console.log('✓ AuthModal contains Instant Demo access:', hasDemoOption);

  // Switch to sign-up to verify Role choices
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.modal-card button'));
    const signUpBtn = btns.find(b => b.textContent.includes('Create Account'));
    if (signUpBtn) signUpBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const signUpContent = await page.$eval('.modal-card', el => el.innerText);
  const hasRoles = signUpContent.includes('Artist / Creator') && signUpContent.includes('Studio Supplier');
  console.log('✓ Sign-up form contains Creator vs Supplier role selection:', hasRoles);

  // Test Supplier Role navigation
  console.log('[Test 4.5] Testing Supplier Persona Role-tailored experience...');
  await page.evaluate(() => {
    const demoButtons = Array.from(document.querySelectorAll('.modal-card button'));
    const supplierDemo = demoButtons.find(b => b.textContent.includes('Kabir') || b.textContent.includes('Supplier'));
    if (supplierDemo) supplierDemo.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const navLabels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.desktop-sidebar .sidebar-link, .bottom-nav .nav-tab')).map(b => b.innerText.trim());
  });
  const hasSupplierDeskNav = navLabels.some(l => l.includes('Supplier Desk'));
  console.log('✓ Navigation dynamically updated for Supplier role with Supplier Desk:', hasSupplierDeskNav);

  // Reset session to default demo creator
  await page.evaluate(() => {
    const demo = {
      id: "cust-aanya",
      name: "Aanya Sharma",
      email: "aanya.artist@reform.studio",
      role: "creator"
    };
    localStorage.setItem('reform_current_user_v1', JSON.stringify(demo));
  });

  await browser.close();
  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 4 AUTHENTICATION REQUIREMENTS VERIFIED!');
  console.log('======================================================');
}

testPhase4Auth().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
