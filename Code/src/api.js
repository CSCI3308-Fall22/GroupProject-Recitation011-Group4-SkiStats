const axios = require("axios");
const { Client } = require("@googlemaps/google-maps-services-js");

const googleMapsClient = new Client({});

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

// origins: [str]
// destinations: [str]
// departureTime: Date

// https://googlemaps.github.io/google-maps-services-js/classes/Client.html#distancematrix
const getRouteDistanceTime = async (origins, destinations, departureTime) => {
  return googleMapsClient.distancematrix({
    params: {
      departure_time: departureTime,
      destinations: destinations,
      origins: origins,
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
    timeout: 2000, // Request timeout (in milliseconds)
  });
};

// Note: The API Key will need to be restricted to our domain when we push to production, because it will be publicly visible.
const getGoogleMapEmbed = function (width, height, origin, destination) {
  return (
    "<iframe width='" +
    width +
    "' height='" +
    height +
    "' style='border:0' loading='lazy' allowfullscreen referrerpolicy='no-referrer-when-downgrade' src='https://www.google.com/maps/embed/v1/directions?origin=" +
    encodeURIComponent(origin) +
    "&destination=" +
    encodeURIComponent(destination) +
    "&key=" +
    process.env.GOOGLE_MAPS_API_KEY +
    "'></iframe>"
  );
};

const getHotel = async (lat, long) => {
  console.log("ingetHotel");
  axios({
    url: `test.api.amadeus.com/reference-data/locations/hotels/by-geocode`,
    method: "GET",
    dataType: "json",
    headers: {
      Authorization: "Bearer" + "api_key",
    },
    params: {
      latitude: lat,
      longitude: long,
      radius: 15,
    },
  })
    .then((res) => {
      res.data, console.log("inresponse");
      console.log(res.data);
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/");
    });
};

const getLatLong = async (city) => {
  let url =
    "http://api.openweathermap.org/geo/1.0/direct?q=" +
    city +
    "&limit=0&appid=ef09dadf66ef76c8ce41972f2a923c75";
  return await axios
    .get(url)
    .then((res) => res.data[0])
    .catch(function (error) {
      console.log(error);
    });
};

module.exports.getWeatherData = getWeatherData;
module.exports.getRouteDistanceTime = getRouteDistanceTime;
module.exports.getGoogleMapEmbed = getGoogleMapEmbed;
module.exports.getLatLong = getLatLong;
