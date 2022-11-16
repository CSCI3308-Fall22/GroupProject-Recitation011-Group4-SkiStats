const express = require('express');
const api = require('./api');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

// User variable for sessions
const user = {
    user_id: undefined,
    is_admin: undefined,
    username: undefined,
    name: undefined,
    home_address: undefined,
    account_created: undefined,
};

// DB Configuration
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

// Test DB connection
db.connect()
    .then(obj => {
        console.log("Database connection successful.");
        obj.done(); // release the connection.
    })
    .catch(error => {
        console.log("ERROR:", error.message || error);
    });

// Create the Admin user
let password = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
db.none("INSERT INTO users(username,password,is_admin) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING", [
  process.env.ADMIN_USERNAME,
  password,
]);

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

// Redirect '/' to '/login'.
app.get("/", (req, res) => {
    if (req.session.user === undefined) {
        res.redirect("/login");
    } else {
        res.redirect("/discovery");
    }
});

app.get("/login", (req, res) => {
    res.render("pages/login");
});

app.post("/login", async (req, res) => {
    const query = `select * from users where username = $1;`;
    db.any(query, [req.body.username])
        .then(async data => {
            bcrypt.compare(req.body.password, data[0].password)
                .then(match => {
                    if (!match) {
                        throw new Error("Incorrect username or password.");
                    }
                    user.user_id = data[0].id;
                    user.is_admin = data[0].is_admin;
                    user.username = data[0].username;
                    user.name = data[0].name;
                    user.home_address = data[0].home_address;
                    user.account_created = data[0].account_created_at;

                    req.session.user = user;
                    req.session.save();

                    res.redirect("/discovery");
                })
                .catch(err => {
                    res.render("pages/login", {
                        error: true,
                        message: err.message
                    })
                })
        })
        .catch(_ => {
            res.render("pages/login", {
                error: true,
                message: "Incorrect username or password."
            });
        })
});

app.get("/discovery", (req, res) => {
    res.render("pages/discovery");
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
            logo: weather.forecast.periods[i].icon
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
    let origin = (req.session.user.home_address != null) ? req.session.user.home_address : "Boulder, Colorado";

    let image = "https://wallpaperaccess.com/full/896261.jpg";

    getMountainData(dest, origin, image, lat, long)
        .then((data) => {
            res.render("pages/data", {mountainData: data});
        })
        .catch((err) => {
            console.log(err);
        })
});

app.get('/register', (req, res) => {
    res.render('pages/register', {});
});
  
app.post('/register', async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);
    const query = 'INSERT INTO users (name, home_address, username, password) VALUES ($1, $2, $3, $4) RETURNING * ;';
            db.any(query, [
                req.body.name,
                req.body.home_address,
                req.body.username,
                hash,
            ])
                .then(function (data) {
                res.redirect("/login");
                })
                .catch(function (err) {
                res.render("pages/register",{error: err ,message:"Email already attached to an account!"})
                });
    });

// Authentication middleware
const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
};
app.use(auth);

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('pages/login');
});

app.listen(3000);
console.log("Server is listening on port 3000...");
