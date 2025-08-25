// Test script to check scraping functionality
async function testScrape() {
  const testUrl = 'https://www.apeuni.com/practice/shadowing/55?type=shadowing';
  const apiUrl = `http://localhost:3001/api/scrape?url=${encodeURIComponent(testUrl)}`;
  
  console.log('Testing scrape with URL:', testUrl);
  console.log('API endpoint:', apiUrl);
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Scraping successful!');
      if (data.audioSrc) {
        console.log('🎵 Audio found:', data.audioSrc);
      } else {
        console.log('❌ No audio found');
      }
      
      if (data.raBodyContent) {
        console.log('📝 Text found:', data.raBodyContent.substring(0, 100) + '...');
      } else {
        console.log('❌ No text content found');
      }
    } else {
      console.log('\n❌ Scraping failed:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testScrape();
