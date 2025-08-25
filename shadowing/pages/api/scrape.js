import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Clean and validate URL
  let cleanUrl = url.trim();
  
  // Add https:// if no protocol is specified
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // Validate URL format
  try {
    new URL(cleanUrl);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format: ' + cleanUrl });
  }

  console.log('Scraping URL:', cleanUrl);

  let browser;
  
  try {
    // Launch Puppeteer in headless mode with Windows-compatible settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    
    // Set timeout and user agent
    await page.setDefaultTimeout(30000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the URL
    await page.goto(cleanUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000);

    // Extract audio src
    let audioSrc = null;
    try {
      const audioElement = await page.$('audio[data-testid="audio"]');
      if (audioElement) {
        audioSrc = await page.evaluate(el => el.src, audioElement);
      }
    } catch (error) {
      console.log('Audio element not found:', error.message);
    }

    // Extract ra-body content
    let raBodyContent = null;
    try {
      const raBodyElement = await page.$('div.ra-body');
      if (raBodyElement) {
        raBodyContent = await page.evaluate(el => el.textContent ? el.textContent.trim() : null, raBodyElement);
      }
    } catch (error) {
      console.log('RA body element not found:', error.message);
    }

    // Return the results
    res.status(200).json({
      audioSrc: audioSrc || null,
      raBodyContent: raBodyContent || null
    });

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape the webpage',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
