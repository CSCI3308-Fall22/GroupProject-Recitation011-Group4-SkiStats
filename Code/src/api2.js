const axios = require("axios");

const getHotel = async (lat, long) => {
  console.log('ingetHotel')
  axios({
    url: `test.api.amadeus.com/reference-data/locations/hotels/by-geocode`,
        method: 'GET',
        dataType:'json',
        headers: {
          "Authorization" : 'Bearer' + 'api_key'
        },
        params: {
            "latitude": 0,
            "longitude": 0,
            'radius': 15
        }
    })
    .then(res => {
        res.data,
        console.log('inresponse')
        console.log(res.data)
    })
    .catch(err => {
      console.log(err);
      res.redirect('/');
    })
    };