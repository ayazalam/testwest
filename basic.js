const axios = require('axios');

const login = 'b58f6a2c0f068f30a4e8';
const key = '4yB98r4Za0skVZ';

const apiUrl = 'https://api.streamtape.com/account/info';

axios.get(apiUrl, {
  params: {
    login: login,
    key: key
  }
})
  .then(function (response) {
    const accountInfo = response.data.result;
    console.log('Account ID:', accountInfo.apiid);
    console.log('Email:', accountInfo.email);
    console.log('Signup Date:', accountInfo.signup_at);
  })
  .catch(function (error) {
    console.error('Error retrieving account information:', error.message);
  });
