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

    // Define the maximum number of simultaneous downloads/uploads
    const maxSimultaneous = 3;

    // Start processing videos
    let startIndex = 0;
    while (startIndex < documents.length) {
      const batch = documents.slice(startIndex, startIndex + maxSimultaneous);
      const promises = [];

      for (let i = 0; i < batch.length; i++) {
        const index = startIndex + i;
        promises.push(processVideo(batch[i], index));
      }

      // Wait for all promises (videos) to complete
      await Promise.all(promises);

      startIndex += maxSimultaneous;
    }

    console.log('All videos processed successfully');

    // Close the MongoDB connection
    client.close();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

async function processVideo(video, index) {
  const videoUrl = video.videoUrl;
  const videoSrc = video.videoSrc;
  const headline = video.headline;
  const celebrities = video.celebrities;
  const originalPornstar = video.originalPornstar;
  const categories = video.categories;
  const tags = video.tags;
  const screenshotHrefList = video.screenshotHrefList;
  const saveFileName = `${index}.mp4`; // Use a unique file name for each video
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
      process.stdout.write(`Downloading (${index}): ${progress.toFixed(2)}%`);
    });

    await new Promise((resolve, reject) => {
      response.data.pipe(fs.createWriteStream(savePath))
        .on('finish', function () {
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          console.log(`Download complete (${index}). File size: ${totalSize} bytes`);
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

    console.log(`Upload (${index}) successful!`);
    console.log('Download URL:', uploadResult.data.result[0].download_url);
    console.log('Filecode:', uploadResult.data.result[0].filecode);
    console.log('Size:', uploadResult.data.result[0].size);
    console.log('Uploaded:', uploadResult.data.result[0].uploaded);

    const myVideoUrl = uploadResult.data.result[0].download_url;
    console.log(myVideoUrl);

    const myApiKey = '264320lkwn7kdbq9ed80vu';
    const apiUrl = `https://doodapi.com/api/upload/url?key=${myApiKey}&url=${myVideoUrl}`;

    try {
        const response = await axios.get(apiUrl);
        console.log(response.data);
        console.log('here ' + response.data.result.download_url);
        myDownloadUrl = response.data.result.download_url;
      } catch (error) {
        console.error(error);
      }

    // // Remote upload to another Dood Stream account
    // const remoteUploadUrl = `https://doodapi.com/api/upload/url`;
    // const remoteUploadResponse = await axios.post(remoteUploadUrl, {
    // key: '264320lkwn7kdbq9ed80vu',
    // url: uploadResult.data.result[0].download_url
    // });
    // console.log('Remote Upload Response:', remoteUploadResponse.data);

    // Save the document with additional fields in the 'ready' collection
    const db = client.db(databaseName);
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
      embedUrl,
      myDownloadUrl
    };
    await readyCollection.insertOne(readyDocument);
  } catch (error) {
    console.error(`An error occurred while processing video (${index}):`, error.message);
    console.log('Moving on to the next video...');
  } finally {
    // Delete the downloaded video from disk
    try {
      fs.unlinkSync(savePath);
      console.log(`Deleted video (${index}) from disk`);
    } catch (error) {
      console.error(`An error occurred while deleting video (${index}):`, error.message);
    }
  }
}
