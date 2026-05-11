const appJson = require('./app.json');

module.exports = () => ({
  ...appJson.expo,
  extra: {
    weatherApiKey: process.env.EXPO_PUBLIC_WEATHER_API_KEY,
  },
});
