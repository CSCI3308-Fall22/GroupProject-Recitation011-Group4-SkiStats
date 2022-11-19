const express = require("express");
const api = require("./api");
const app = express();
const axios = require("axios");
const pgp = require("pg-promise")();
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");

// DB Configuration
const dbConfig = {
  host: "db",
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

// Test DB connection
db.connect()
  .then((obj) => {
    console.log("Database connection successful.");
    obj.done(); // release the connection.
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
  });

// Create the Admin user
let password = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
db.none(
  "INSERT INTO users(username,password,is_admin) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING",
  [process.env.ADMIN_USERNAME, password]
);

app.set("view engine", "ejs");
app.use(bodyParser.json());

// Set session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Restrict website access until the user is logged in
const auth = (req, res, next) => {
  if (!req.session.user) {
    if (!["/login", "/register", "/discovery"].includes(req.path)) {
      return res.redirect("/login");
    }
  }
  next();
};

app.use(auth);

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
});

let token = "null";

const Accessurl = {
  url: "https://test.api.amadeus.com/v1/security/oauth2/token",
  raw_url: "https://test.api.amadeus.com/v1/security/oauth2/token",
  method: "post",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  data: {
    grant_type: "client_credentials",
    client_id: process.env.AMADEUS_CLIENT_ID,
    client_secret: process.env.AMADEUS_CLIENT_SECRET,
  },
};

// Redirect '/' to '/login'.
app.get("/", (req, res) => {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    res.redirect("/discovery");
  }
});

app.get("/register", (req, res) => {
  res.render("pages/register");
});

app.post("/register", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const query =
    "INSERT INTO users (name, home_address, username, password) VALUES ($1, $2, $3, $4) RETURNING * ;";
  db.any(query, [req.body.name, req.body.home_address, req.body.username, hash])
    .then(function (data) {
      res.redirect("/login");
    })
    .catch(function (err) {
      res.render("pages/register", {
        error: err,
        message: "Email already attached to an account!",
      });
    });
});

app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.post("/login", async (req, res) => {
  const query = `select * from users where username = $1;`;
  db.oneOrNone(query, [req.body.username])
    .then(async (data) => {
      if (data) {
        const match = await bcrypt.compare(req.body.password, data.password);

        if (match) {
          req.session.user = {
            user_id: data.id,
            is_admin: data.is_admin,
            username: data.username,
            name: data.name,
            home_address: data.home_address,
            account_created: data.account_created_at,
          };
          req.session.save();

          res.redirect("/discovery");
        } else {
          res.render("pages/login", {
            message: "Incorrect username or password!",
            error: true,
          });
        }
      } else {
        res.render("pages/login", {
          message: "Incorrect username or password!",
          error: true,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.render("pages/login", {
        message: "User lookup failed!",
        error: true,
      });
    });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/account-settings", (req, res) => {
  res.render("pages/account-settings");
});

app.post("/account-settings", async (req, res) => {
  if (req.body.passwordField) {
    var hash = await bcrypt.hash(req.body.passwordField, 10);
    var query =
      "UPDATE users SET name=$1, home_address=$2, username=$3, password=$4 WHERE username = $5";
  } else {
    var hash = "";
    var query =
      "UPDATE users SET name=$1, home_address=$2, username=$3 WHERE username = $5";
  }

  db.none(query, [
    req.body.nameField || null,
    req.body.addressField || null,
    req.body.emailField,
    hash,
    req.session.user.username,
  ])
    .then(function () {
      req.session.user.username = req.body.emailField;
      req.session.user.name = req.body.nameField;
      req.session.user.home_address = req.body.addressField;
      req.session.save();

      res.render("pages/account-settings", {
        message: "Account details updated successfully!",
      });
    })
    .catch(function (err) {
      console.log(err);
      res.render("pages/account-settings", {
        error: true,
        message: "Failed to update account details!",
      });
    });
});

app.post("/updHotels", async (req, res) => {
  const latlon = await api.getLatLong(req.body.city);

  if (!latlon) {
    res.render("pages/discovery", {
      message: "No hotels found!",
      error: true,
    });
    return;
  }

  axios(Accessurl).then((results) => {
    //api call to refresh access token
    token = results.data.access_token;
    //console.log(token);
  });
  let toki = await axios(Accessurl);
  //console.log(toki.data.access_token);
  token = toki.data.access_token;

  let config = {
    headers: { Authorization: "Bearer " + token },
    params: {
      latitude: latlon.lat,
      longitude: latlon.lon,
    },
  };
  //console.log("MY PARAMS ARE:" + config.params.latitude,config.params.longitude);
  const rest = await axios
    .get(
      "https://test.api.amadeus.com/v1//reference-data/locations/hotels/by-geocode",
      config
    )
    .then((response) => {
      //console.log(response.data.data);
      res.render("pages/discovery", { data: response.data.data });
    })
    .catch((error) => {
      res.render("pages/discovery", {
        message: "NO HOTEL INFO FOR THIS CITY",
        error: true,
      });
      //console.log(error);
    });

  //console.log(rest.data.data);
});

app.get("/discovery", (req, res) => {
  axios(Accessurl)
    .then((results) => {
      //api call to refresh access token
      token = results.data.access_token;
      console.log(token);
    })
    .finally(() => {
      axios({
        url: "https://test.api.amadeus.com/v1//reference-data/locations/hotels/by-geocode", //api to get hotels using access token
        method: "GET",
        dataType: "json",
        headers: {
          Authorization: "Bearer " + token,
        },
        params: {
          latitude: 40.01925,
          longitude: -105.2640669,
        },
      })
        .then((results) => {
          //console.log(token);
          //console.log("Succes",results.data.data)
          res.render("pages/discovery", { data: results.data.data });
        })
        .catch(function (error) {
          console.log(token);
          //console.log(error);
        });
    })
    .catch(function (error) {
      console.log(error);
    });
});

async function getMountainData(dest, origin, image, lat, long) {
  // Get mountain weather.
  let weather = await api.getWeatherData(lat, long);
  let forecasts = [];
  for (let i = 0; i < 6; i++) {
    forecasts.push({
      dt: weather.forecast.periods[i].name,
      temp: weather.forecast.periods[i].temperature,
      tempUnit: weather.forecast.periods[i].temperatureUnit,
      trend: weather.forecast.periods[i].temperatureTrend,
      windSpeed: weather.forecast.periods[i].windSpeed,
      windDir: weather.forecast.periods[i].windDirection,
      details: weather.forecast.periods[i].detailedForecast,
      logo: weather.forecast.periods[i].icon,
    });
  }
  // Get route map
  let map = api.getGoogleMapEmbed(500, 500, origin, dest);
  return { dest, image, forecasts, map };
}

app.get("/data", (req, res) => {
  let dest = req.query.dest;
  let lat = Number(req.query.lat);
  let long = Number(req.query.long);
  let origin =
    req.session.user.home_address != null
      ? req.session.user.home_address
      : "Boulder, Colorado";

  let image = "https://wallpaperaccess.com/full/896261.jpg";

  getMountainData(dest, origin, image, lat, long)
    .then((data) => {
      res.render("pages/data", { mountainData: data });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/filter", function (req, res) {
  var state = String(req.body.State);
  var ease = Boolean(req.body.Ease);
  var num_runs = Boolean(req.body.Total_runs);
  var name = Boolean(req.body.Name);
  var pass = String(req.body.Pass);

  var query = "SELECT * from ski_mountain";
  var notFirst = 0;
  passFlag = 0;
  if (pass == "Ikon") {
    query += " WHERE Pass = $1";
    passFlag = 1;
  } else if (pass == "Epic") {
    query += " WHERE Pass = $1";
    passFlag = 1;
  }

  if (state != "") {
    if ((passFlag = 1)) {
      query += " AND";
    } else {
      query += " WHERE";
    }
    query += " State = $2";
  }
  if (ease == 1) {
    if (notFirst == 0) query += " ORDER BY";
    query += " Ease DESC";
    notFirst = 1;
  }
  if (num_runs == 1) {
    if (notFirst == 0) query += " ORDER BY";
    if (notFirst == 1) query += ",";
    query += " Total_runs DESC";
    notFirst = 1;
  }
  if (name == 1) {
    if (notFirst == 0) query += " ORDER BY";
    if (notFirst == 1) query += ",";
    query += " Name DESC";
    notFirst = 1;
  }
  query += ";";
  db.any(query, [req.body.Pass, req.body.State])
    .then(function (rows) {
      res.send(rows);
    })
    .catch(function (err) {
      console.log(err);
    });
});

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
      latitude: 0,
      longitude: 0,
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

app.get("/wishlist", async (req, res) => {
  const query =
    "SELECT * FROM wishlist INNER JOIN ski_mountain ON ski_mountain.id = wishlist.ski_mountainid WHERE wishlist.userID = $1 GROUP BY wishlist.id, ski_mountain.id;";

  await db
    .manyOrNone(query, [req.session.user.user_id])
    .then((data) => {
      res.render("pages/wishlist", {
        data: data,
      });
    })
    .catch((err) => {
      console.log(err);
      res.render("pages/wishlist", {
        error: true,
        message: "Failed to retrieve wishlist!",
      });
    });
});

app.post("/wishlist", async (req, res) => {
  await db
    .none(`DELETE FROM wishlist WHERE userid = $1 AND ski_mountainid = $2;`, [
      req.session.user.user_id,
      parseInt(req.body.ski_mountainid),
    ])
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      res.redirect("/wishlist");
    });
});

app.listen(3000);
console.log("Server is listening on port 3000...");
