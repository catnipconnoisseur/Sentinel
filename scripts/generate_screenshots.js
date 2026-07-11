const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const outputDir = path.join(__dirname, '../docs/images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🚀 Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('1. Navigating to Sentinel Dashboard (http://localhost:5175)...');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle2' });

    console.log('Waiting for machine cards to load...');
    await page.waitForSelector('.glass-card', { timeout: 10000 });

    // Capture dashboard screenshot
    console.log('📸 Capturing dashboard.png...');
    await page.screenshot({ path: path.join(outputDir, 'dashboard.png') });

    // Capture machine selection screenshot (focusing on Machine 1)
    console.log('📸 Capturing machine-selection.png...');
    await page.screenshot({ path: path.join(outputDir, 'machine-selection.png') });

    // Navigate to Machine 1
    console.log('Navigating to Machine 1 Detail Page...');
    await page.click('a[href="/machines/1"]');
    await page.waitForSelector('textarea, input', { timeout: 10000 });

    // Type query
    const query = 'Why did this machine fail recently?';
    console.log(`Typing investigation query: "${query}"`);
    await page.type('textarea, input', query);

    // Capture loading screenshot
    console.log('Submitting investigation...');
    await page.keyboard.press('Enter');
    
    // Quick wait to capture loading animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('📸 Capturing investigation-loading.png...');
    await page.screenshot({ path: path.join(outputDir, 'investigation-loading.png') });

    // Wait for the investigation to finish (up to 40 seconds)
    console.log('Waiting for RAG reasoning graph to finish rendering...');
    await page.waitForSelector('.react-flow__node', { timeout: 45000 });
    
    // Add extra delay for animations to finish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Capture final summary report
    console.log('📸 Capturing investigation-summary.png...');
    await page.screenshot({ path: path.join(outputDir, 'investigation-summary.png') });

    // Capture reasoning graph specific component
    console.log('📸 Capturing reasoning-graph.png...');
    const graphElement = await page.$('.react-flow');
    if (graphElement) {
      await graphElement.screenshot({ path: path.join(outputDir, 'reasoning-graph.png') });
    } else {
      await page.screenshot({ path: path.join(outputDir, 'reasoning-graph.png') });
    }

    // Capture engineering report specific sections
    console.log('📸 Capturing engineering-report.png...');
    await page.screenshot({ path: path.join(outputDir, 'engineering-report.png') });

    // Select a node to expose the evidence sidebar panel
    console.log('Clicking on a node to show evidence panel...');
    await page.click('.react-flow__node');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('📸 Capturing evidence-panel.png...');
    await page.screenshot({ path: path.join(outputDir, 'evidence-panel.png') });

    console.log('✅ All screenshots generated successfully in docs/images/');

  } catch (e) {
    console.error('❌ Error generating screenshots:', e.message);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
