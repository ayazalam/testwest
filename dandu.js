const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const videoUrl = 'https://mrdeepfakes.com/get_file/1/900c628ba76626673c4863d3db2893acc82dcb20ef/74000/74811/74811_480p.mp4/?br=526&rnd=1688782773876';
const saveFileName = 'video.mp4';
const savePath = path.join(__dirname, saveFileName);

const apiKey = '48460bvw7h3ltiy6js1rf';
const uploadUrl = 'https://doodapi.com/api/upload/server';

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

        axios.get(uploadUrl, {
          params: {
            key: apiKey
          }
        })
          .then(function (response) {
            const serverUrl = response.data.result;
            const fileUploadUrl = serverUrl + '?' + apiKey;

            const formData = new FormData();
            formData.append('api_key', apiKey);
            formData.append('file', fs.createReadStream(path.join(__dirname, saveFileName)));

            axios.post(fileUploadUrl, formData, {
              headers: formData.getHeaders()
            })
              .then(function (response) {
                const uploadResponse = response.data.result[0];
                console.log('Upload successful!');
                console.log('Download URL:', uploadResponse.download_url);
                console.log('Filecode:', uploadResponse.filecode);
                console.log('Size:', uploadResponse.size);
                console.log('Uploaded:', uploadResponse.uploaded);
                // ... Retrieve other information as needed
              })
              .catch(function (error) {
                console.error('Error after upload:', error.message);
              });
          })
          .catch(function (error) {
            console.error('Error retrieving server URL:', error.message);
          });
      })
      .on('error', function (err) {
        console.error('Error downloading video:', err);
      });
  })
  .catch(function (err) {
    console.error('Error fetching video URL:', err);
  });