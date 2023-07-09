const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { MongoClient } = require('mongodb');

const apiKey = '48460bvw7h3ltiy6js1rf'; // Define your API key here

const mongoUsername = 'pcxbro';
const mongoPassword = '9xriWaXRtXux6IxQ';
const mongoURI = `mongodb+srv://${mongoUsername}:${mongoPassword}@pcx.aojpyyf.mongodb.net/?retryWrites=true&w=majority`;
const databaseName = 'PCXtest';

// Connection options to pass to the MongoDB driver
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Create a new MongoClient
const client = new MongoClient(mongoURI, options);

// Connect to the MongoDB database
client.connect()
  .then(async () => {
    console.log('Connected to MongoDB successfully');

    // Access the PCXtest database
    const db = client.db(databaseName);

    // Access the videos collection
    const collection = db.collection('videos');

    // Retrieve videoUrl, headline, celebrities, originalPornstar, categories, tags, screenshotHrefList from documents
    const documents = await collection.find({}, {
      projection: {
        _id: 0,
        videoUrl: 1,
        videoSrc: 1,
        headline: 1,
        celebrities: 1,
        originalPornstar: 1,
        categories: 1,
        tags: 1,
        screenshotHrefList: 1
      }
    }).toArray();

    if (documents.length === 0) {
      console.log('No video documents found');
      client.close();
      return;
    }

    // Process each document/video sequentially
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const videoUrl = doc.videoUrl;
      const videoSrc = doc.videoSrc;
      const headline = doc.headline;
      const celebrities = doc.celebrities;
      const originalPornstar = doc.originalPornstar;
      const categories = doc.categories;
      const tags = doc.tags;
      const screenshotHrefList = doc.screenshotHrefList;
      const saveFileName = `${i}.mp4`; // Use a unique file name for each video
      const savePath = path.join(__dirname, saveFileName);
      let embedUrl = '';

      try {
        const response = await axios({
          method: 'get',
          url: videoSrc,
          responseType: 'stream'
        });

        const totalSize = response.headers['content-length'];
        let downloadedSize = 0;

        response.data.on('data', function (chunk) {
          downloadedSize += chunk.length;
          const progress = (downloadedSize / totalSize) * 100;
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(`Downloading (${i}): ${progress.toFixed(2)}%`);
        });

        await new Promise((resolve, reject) => {
          response.data.pipe(fs.createWriteStream(savePath))
            .on('finish', function () {
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              console.log(`Download complete (${i}). File size: ${totalSize} bytes`);
              resolve();
            })
            .on('error', function (err) {
              reject(err);
            });
        });

        const uploadResponse = await axios.get('https://doodapi.com/api/upload/server', {
          params: {
            key: apiKey
          }
        });

        const serverUrl = uploadResponse.data.result;
        const fileUploadUrl = serverUrl + '?' + apiKey;

        const formData = new FormData();
        formData.append('api_key', apiKey);
        formData.append('file', fs.createReadStream(savePath));

        const uploadResult = await axios.post(fileUploadUrl, formData, {
          headers: formData.getHeaders()
        });

        embedUrl = uploadResult.data.result[0].protected_embed;

        console.log(`Upload (${i}) successful!`);
        console.log('Download URL:', uploadResult.data.result[0].download_url);
        console.log('Filecode:', uploadResult.data.result[0].filecode);
        console.log('Size:', uploadResult.data.result[0].size);
        console.log('Uploaded:', uploadResult.data.result[0].uploaded);
      } catch (error) {
        console.error(`An error occurred while processing video (${i}):`, error.message);
        console.log('Moving on to the next video...');
      }

      // Save the document with additional fields in the 'ready' collection
      const readyCollection = db.collection('ready');
      const readyDocument = {
        videoUrl,
        videoSrc,
        headline,
        celebrities,
        originalPornstar,
        categories,
        tags,
        screenshotHrefList,
        embedUrl
      };
      await readyCollection.insertOne(readyDocument);
    }

    // Close the MongoDB connection
    client.close();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
