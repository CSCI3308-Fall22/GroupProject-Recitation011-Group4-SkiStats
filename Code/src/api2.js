const axios = require("axios");


const getHotel = async (lat, long) => {
    let url = 'test.api.amadeus.com/reference-data/locations/hotels/by-geocode' +
    lat + "," + long + "," + 15;
    return await axios
    .get(url)
    .then((res) => res.data)
    .catch(function (error) {
      console.log(error);
    });
}
