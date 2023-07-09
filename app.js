const axios = require('axios');
const fs = require('fs');
const path = require('path');

const videoUrl = 'https://mrdeepfakes.com/get_file/1/900c628ba76626673c4863d3db2893acc82dcb20ef/74000/74811/74811_480p.mp4/?br=526&rnd=1688782773876';
const saveFileName = 'video.mp4';
const savePath = path.join(__dirname, saveFileName);

axios({
  method: 'get',
  url: videoUrl,
  responseType: 'stream'
})
  .then(function (response) {
    const totalSize = response.headers['content-length'];
    let downloadedSize = 0;

    response.data.on('data', function (chunk) {
      downloadedSize += chunk.length;
      const progress = (downloadedSize / totalSize) * 100;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Downloading: ${progress.toFixed(2)}%`);
    });

    response.data.pipe(fs.createWriteStream(savePath))
      .on('finish', function () {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(`Download complete. File size: ${totalSize} bytes`);
      })
      .on('error', function (err) {
        console.error('Error downloading video:', err);
      });
  })
  .catch(function (err) {
    console.error('Error fetching video URL:', err);
  });
