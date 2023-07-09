const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path')

const apiKey = '48460bvw7h3ltiy6js1rf';
const uploadUrl = 'https://doodapi.com/api/upload/server';

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
    formData.append('file', fs.createReadStream(path.join(__dirname, 'video.mp4'))); // Replace with the path to your local video file

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
