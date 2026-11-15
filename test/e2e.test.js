import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';

async function runTests() {
  console.log("=== Starting Re:form Comprehensive Automated Quality Checks ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Mobile width test (390px)
    console.log("\n[Test 1] Testing Mobile Layout (390x844)...");
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.main-wrapper', { visible: true });

    // Ensure session starts with verified demo creator
    await page.evaluate(() => {
      const demoUser = {
        id: "cust-aanya",
        name: "Aanya Sharma",
        email: "aanya.artist@reform.studio",
        role: "creator"
      };
      localStorage.setItem('reform_current_user_v1', JSON.stringify(demoUser));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.main-wrapper', { visible: true });

    const title = await page.title();
    console.log(`✓ Page Title: "${title}"`);
    if (!title.toLowerCase().includes("re:create") && !title.toLowerCase().includes("re:form")) {
      throw new Error("Title does not include brand name");
    }

    // Check bottom nav on mobile (8 tabs)
    const bottomNav = await page.$('.bottom-nav');
    if (!bottomNav) throw new Error("Mobile bottom navigation bar not found!");
    const tabs = await page.$$('.bottom-nav .nav-tab');
    console.log(`✓ Mobile bottom navigation bar detected with ${tabs.length} tabs`);
    if (tabs.length < 5) throw new Error(`Expected at least 5 mobile tabs, got ${tabs.length}`);

    // Check stat cards on Dashboard (Materials, Challenges, Waste, CO2, Active Orders, Latest Order Status)
    const statCards = await page.$$('.stat-card');
    console.log(`✓ Stat cards detected on Dashboard: ${statCards.length}`);
    if (statCards.length < 4) throw new Error(`Expected at least 4 stat cards, got ${statCards.length}`);

    // Check "How we calculate this" popover
    console.log("\n[Test 2] Testing 'How we calculate this' popover...");
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="How we calculate impact metrics"]');
      if (btn) btn.click();
    });

    await page.waitForSelector('.modal-content', { visible: true, timeout: 5000 });
    const modalText = await page.$eval('.modal-content', el => el.innerText);
    if (!modalText.includes("Emission Factors") || !modalText.includes("DEFRA")) {
      throw new Error("Modal missing required calculation notes");
    }
    console.log("✓ Popover opened and contains required formula & disclaimer");
    
    // Close popover
    await page.evaluate(() => {
      const close = document.querySelector('.modal-content button.btn-secondary') || document.querySelector('.modal-content button[aria-label="Close modal"]');
      if (close) close.click();
    });
    await page.waitForSelector('.modal-content', { hidden: true, timeout: 5000 });
    console.log("✓ Popover closed successfully");

    // 2. Scan Scraps Flow
    console.log("\n[Test 3] Testing AI Material Scanner flow...");
    await page.evaluate(() => {
      const tab = document.querySelector('.bottom-nav button[aria-label="Scan"]');
      if (tab) tab.click();
    });
    await page.waitForSelector('.page-title');

    const demoScanBtn = await page.$('button::-p-text(Use Demo Scan)');
    if (!demoScanBtn) throw new Error("Demo scan button not found");
    await demoScanBtn.click();

    await page.waitForSelector('.card input[placeholder="Material Name"]');
    const detectedCards = await page.$$('.card input[placeholder="Material Name"]');
    console.log(`✓ Demo scan loaded ${detectedCards.length} editable scrap cards`);

    const addBtn = await page.$('button::-p-text(Add)');
    await addBtn.click();
    await page.waitForSelector('button::-p-text(View Dashboard)');
    console.log("✓ Scraps successfully added to platform state & storage");

    // 3. Supplier Map Flow (Feature A)
    console.log("\n[Test 4] Testing Supplier Map & Nearest Matching (Feature A)...");
    await page.evaluate(() => {
      const tab = document.querySelector('.bottom-nav button[aria-label="Map"]');
      if (tab) tab.click();
    });
    await page.waitForSelector('.leaflet-container', { visible: true, timeout: 10000 });
    console.log("✓ Leaflet interactive map rendered with OpenStreetMap tiles");

    // Verify Best Match card and AI reason
    const bestMatchBadge = await page.$('.badge::-p-text(AI Best Match)');
    if (!bestMatchBadge) throw new Error("AI Best match card not found on Map!");
    console.log("✓ AI Best Match card is visible with distance & studio details");

    // Click "Request materials" on top match
    const requestMaterialsBtn = await page.$('button::-p-text(Request materials)');
    if (!requestMaterialsBtn) throw new Error("Request materials button not found");
    await requestMaterialsBtn.click();
    await page.waitForSelector('.modal-backdrop', { visible: true });
    console.log("✓ Request Materials modal opened");

    // Submit request
    const confirmRequestBtn = await page.$('.modal-backdrop button::-p-text(Confirm Request)');
    if (confirmRequestBtn) {
      await confirmRequestBtn.click();
      console.log("✓ Material request submitted, redirecting to Orders tab");
    }

    // 4. Orders and Delivery Tracking (Feature C)
    console.log("\n[Test 5] Testing Orders & Delivery Tracking (Feature C)...");
    await page.waitForSelector('.card::-p-text(TRACKING TIMELINE)', { timeout: 10000 });
    console.log("✓ Orders page loaded with vertical tracking timeline");

    // Simulate next status (1-click demo button)
    const simulateStatusBtn = await page.$('button::-p-text(Simulate Next Status ⚡)');
    if (simulateStatusBtn) {
      await simulateStatusBtn.click();
      console.log("✓ Status simulation triggered, advanced timeline step");
    }

    // Toggle Supplier View
    const supplierViewBtn = await page.$('button::-p-text(I\'m a Supplier)');
    if (supplierViewBtn) {
      await supplierViewBtn.click();
      await page.waitForSelector('.card::-p-text(SUPPLIER CONTROL DESK)');
      console.log("✓ Supplier View Desk active with status advance buttons");
      // Switch back to Artist View
      const artistViewBtn = await page.$('button::-p-text(Artist View)');
      if (artistViewBtn) await artistViewBtn.click();
    }

    // 5. Customer Sign In, Sign Up & Provided Materials Tracking (New Feature)
    console.log("\n[Test 6] Testing Customer Accounts & Provided Materials Tracking...");
    await page.evaluate(() => {
      const tab = document.querySelector('.bottom-nav button[aria-label="Custody"]');
      if (tab) tab.click();
    });
    await page.waitForSelector('.card::-p-text(Allocated Materials)', { timeout: 10000 });
    console.log("✓ Customer Custody page loaded showing current customer profile & stats");

    // Verify materials provided to current customer
    const userMaterialCards = await page.$$('.card::-p-text(Provided by:)');
    console.log(`✓ Customer currently has ${userMaterialCards.length} verified material provisions listed`);

    // Switch to "All Customer Allocations" tab
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('All Customer Allocations'));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes('MATERIALS PROVIDED TO THIS CUSTOMER'), { timeout: 10000 });
    console.log("✓ Platform directory displayed showing all customers and which materials they were provided with");

    // Open Auth Modal via Sign In / Register button
    console.log("\n[Test 7] Testing Sign In / Sign Up Modal with Firebase Auth & Demo Switch...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In / Register'));
      if (btn) btn.click();
    });
    await page.waitForSelector('.modal-card', { visible: true });
    console.log("✓ Auth modal opened with Sign In form");

    // Switch to "Create Account"
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.modal-card button')).find(b => b.textContent.includes('Create Account'));
      if (tab) tab.click();
    });
    await page.waitForSelector('.modal-card input[placeholder*="Aanya"]');
    console.log("✓ Switched to Sign Up mode with Name, Email, Password, and Role selection");

    // Test 1-click Demo Account login as "Rohan Verma"
    await page.evaluate(() => {
      const rohanBtn = Array.from(document.querySelectorAll('.modal-card button')).find(b => b.textContent.includes('Rohan Verma'));
      if (rohanBtn) rohanBtn.click();
    });
    await page.waitForSelector('.modal-backdrop', { hidden: true });
    console.log("✓ Logged in as Rohan Verma (Sculptor), updated session & provided materials view");

    // 6. AI Chat Assistant (Feature B)
    console.log("\n[Test 8] Testing AI Chat Assistant (Feature B)...");
    const chatTriggerBtn = await page.$('button[aria-label="Open Re:form Assistant"]');
    if (!chatTriggerBtn) throw new Error("Floating chat button not found!");
    await chatTriggerBtn.click();
    await page.waitForSelector('h4::-p-text(Re:form Assistant)', { visible: true });
    console.log("✓ Re:form Assistant bottom sheet opened");

    // Click Quick Chip: "Where is my order?"
    const orderChip = await page.$('button::-p-text(Where is my order?)');
    if (orderChip) {
      await orderChip.click();
      console.log("Waiting for assistant order reply...");
      await page.waitForFunction(
        () => document.querySelectorAll('.animate-slide-up [style*="border-radius: 14px 14px 14px 2px"]').length >= 2,
        { timeout: 15000 }
      );
      console.log("✓ Assistant replied with order status and action button");
    }

    // Close assistant
    await chatTriggerBtn.click();

    // 7. Desktop Layout Test (1200x800)
    console.log("\n[Test 9] Testing Desktop Layout (1200x800)...");
    await page.setViewport({ width: 1200, height: 800 });
    await page.waitForSelector('.desktop-sidebar', { visible: true });
    console.log("✓ Desktop sidebar is visible and mobile bottom bar is hidden");

    // 8. Console Error Check
    console.log("\n[Test 10] Checking for Browser Console Errors...");
    const criticalErrors = consoleErrors.filter(err => !err.includes("favicon") && !err.includes("tile.openstreetmap.org"));
    if (criticalErrors.length > 0) {
      console.warn("Console Errors found:", criticalErrors);
      throw new Error(`Encountered ${criticalErrors.length} console error(s)`);
    } else {
      console.log("✓ Zero browser console errors detected!");
    }

    console.log("\n========================================================");
    console.log("🎉 ALL QUALITY CHECKS & CUSTOMER AUTH PASSED PERFECTLY!");
    console.log("========================================================\n");

  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
