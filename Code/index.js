const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');

// database configuration
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

app.set('view engine', 'ejs');
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('pages/register', {});
});

app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = 'insert into users (username, password) VALUES ($1, $2) RETURNING * ;';
  db.any(query, [
    req.body.username,
    hash,
  ])
    .then(function (data) {
      res.redirect("/login");
    })
    .catch(function (err) {
      res.status(400).send(err);
    });
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', (req, res) => {
  const query = "SELECT * FROM users WHERE username = $1 ;";
  console.log(req.body)
  db.one(query, [
    req.body.username
  ])
    .then(async (data) => {
      console.log(data)
      const match = await bcrypt.compare(req.body.password, data.password);
      if (match) {
        req.session.user = {
          api_key: process.env.API_KEY,
        };
        req.session.save();
        res.redirect("/discover")
      }
      else {

        res.status(400).send("Incorrect username or password");
      }
    })
    .catch(() => {
      res.redirect("/register");
    })
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to register page.
    return res.redirect('/register');
  }
  next();
};

app.get('/discover', auth, async (req, res) => {
  axios({
    url: `https://app.ticketmaster.com/discovery/v2/events.json`,
    method: 'GET',
    dataType: 'json',
    params: {
      "apikey": req.session.user.api_key,
      "keyword": "lil", //you can choose any artist/event here
      "size": 100,
      "page":0
    }
  })
    .then(results => {
      console.log(results.data);
      res.render("pages/discover", {events: results.data._embedded.events});
    })
    .catch(err => {
      console.log(err);
      res.render("pages/login", {result: []});
    })
});

app.get('/logout', (req, res) => {
  res.render('pages/logout');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/logout');
});

app.listen(3000);
console.log('Server is listening on port 3000');

