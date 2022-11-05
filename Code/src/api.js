const axios = require("axios");

const getWeatherGrid = async (latitude, longitude) => {
  let url =
    "https://api.weather.gov/points/" +
    latitude.toString() +
    "," +
    longitude.toString();
  return await axios
    .get(url)
    .then((res) => res.data)
    .catch(function (error) {
      console.log(error);
    });
};

const getWeatherData = async (latitude, longitude) => {
  const grid = await getWeatherGrid(latitude, longitude);

  let endpoints = [
    grid.properties.forecast,
    grid.properties.forecastHourly,
    "https://api.weather.gov/alerts/active/zone/" +
      grid.properties.forecastZone.match(/[A-Z]{2}[CZ]\d{3}/),
  ];

  const [forecast, forecastHourly, alerts] = await axios.all(
    endpoints.map((endpoint) => axios.get(endpoint).then((res) => res.data))
  );

  return {
    forecast: forecast.properties,
    hourly: forecastHourly.properties,
    alerts: alerts.features,
  };
};

module.exports.getWeatherData = getWeatherData;
