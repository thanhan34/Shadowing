import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 10000 });
    
    const title = await page.title();
    
    res.status(200).json({ 
      success: true, 
      message: 'Puppeteer is working correctly',
      title: title
    });
    
  } catch (error) {
    console.error('Puppeteer test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
