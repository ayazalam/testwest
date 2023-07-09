const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');

const mongoUsername = 'pcxtest';
const mongoPassword = '81hqfS3hRXBEDQgw';
const mongoURI = `mongodb+srv://${mongoUsername}:${mongoPassword}@pcx.aojpyyf.mongodb.net/?retryWrites=true&w=majority`;
const databaseName = 'PCXtest';

async function scrapeData() {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db(databaseName);

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Scrape data from each page
    for (let pageNum = 1; pageNum <= 4; pageNum++) {
      const url = `https://mrdeepfakes.com/most-popular/${pageNum}`;

      console.log(`Scraping page: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle2' });

      // Scrape data from each video item
      const videoItems = await page.$$('.item');
      for (let i = 0; i < videoItems.length; i++) {
        const videoUrl = await videoItems[i].$eval('a', (el) => el.href);

        // Create a new page instance for each video
        const videoPage = await browser.newPage();
        await videoPage.goto(videoUrl, { waitUntil: 'networkidle2' });

        try {
          const videoSrc = await videoPage.$eval('video.fp-engine', (el) => el.src);
          const headline = await videoPage.$eval('div.headline h1', (el) => el.innerText);

          // Extract the "celebrities" value
            const celebritiesElement = await videoPage.$('.item:has(a)');
            const celebrities = await videoPage.$eval('.item:has(a)', (element) => {
            const celebrityLink = element.querySelector('a');
            return celebrityLink.innerText.trim();
            });

            // Extract the "Original Pornstar" value
            // Extract the "Original Pornstar" value
            const originalPornstar = await videoPage.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.item'));
                const originalPornstarItem = items.find(item => item.innerText.includes('Original Pornstar:'));
                if (originalPornstarItem) {
                const pornstarLink = originalPornstarItem.querySelector('a');
                return pornstarLink ? pornstarLink.innerText.trim() : 'unknown';
                }
                return 'unknown';
            });
            
            console.log('Original Pornstar:', originalPornstar);

            // Extract the categories
            const categories = await videoPage.$$eval('.item:has(a)', (elements) => {
                const categoryElement = elements.find((element) =>
                element.innerText.trim().startsWith('Categories:')
                );
                if (categoryElement) {
                const categoryLinks = categoryElement.querySelectorAll('a');
                return Array.from(categoryLinks).map((link) => link.innerText.trim());
                }
                return [];
            });
            
            console.log('Categories:', categories);

            const tags = await videoPage.$$eval('.item:has(a)', (elements) => {
                const tagsElement = elements.find((element) =>
                element.innerText.trim().startsWith('Tags:')
                );
                if (tagsElement) {
                const tagsLinks = tagsElement.querySelectorAll('a');
                return Array.from(tagsLinks).map((link) => link.innerText.trim());
                }
                return [];
            });
            
            console.log('Categories:', tags);

            // Extract the href values from the a elements inside block-screenshots
            const screenshotHrefList = await videoPage.$$eval('.block-screenshots a', (elements) => {
              return elements.map((el) => el.href);
            });

            console.log('Screenshot Hrefs:', screenshotHrefList);


  
  
              


          // Store data in MongoDB
          await db.collection('videos').insertOne({
            videoUrl,
            videoSrc,
            headline,
            celebrities,
            originalPornstar,
            categories,
            tags,
            screenshotHrefList,
          });

          console.log('Data saved to MongoDB', celebrities);
        } catch (error) {
          console.error('An error occurred while scraping the video:', error);
          console.log('Moving on to the next video...');
        }

        // Close the video page
        await videoPage.close();

        // Delay for 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Close Puppeteer and MongoDB connection
    await browser.close();
    client.close();

    console.log('Scraping completed');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

scrapeData();
