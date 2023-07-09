const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const login = 'b58f6a2c0f068f30a4e8';
const key = '4yB98r4Za0skVZ';
const folder = 'PCXtest'; // Replace with your desired folder ID

const uploadUrl = 'https://api.streamtape.com/file/ul';
const videoFilePath = path.join(__dirname, 'video.mp4'); // Replace with the path to the video file you want to upload

const formData = new FormData();
formData.append('login', login);
formData.append('key', key);
formData.append('folder', folder);
formData.append('file1', fs.createReadStream(videoFilePath));

axios.post(uploadUrl, formData, {
  headers: formData.getHeaders(),
  timeout: 60000
})
  .then(function (response) {
    const uploadResponse = response.data;
    if (uploadResponse.status === 200) {
      const uploadResult = uploadResponse.result;
      console.log('Upload successful!');
      console.log('Video URL:', uploadResult.url);
      console.log('Valid until:', uploadResult.valid_until);
    } else {
      console.error('Upload failed:', uploadResponse.msg);
    }
  })
  .catch(function (error) {
    console.error('Error uploading video:', error.message);
  });
