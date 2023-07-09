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

          

          // Store data in MongoDB
          await db.collection('videos').insertOne({
            videoUrl,
            videoSrc,
            headline,
          });

          console.log('Data saved to MongoDB');
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
