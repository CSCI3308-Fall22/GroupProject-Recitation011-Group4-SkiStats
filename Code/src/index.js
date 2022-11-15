const express = require('express');
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

app.use(function(req, res, next) {
    res.locals.user = req.session.user;
    next();
  });

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

app.get("/account-settings", (req, res) => {
  if (req.session.user === undefined) {
    res.redirect("/login");
  } else {
    res.render("pages/account-settings");
  }
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
                    console.log(user.user_id);
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

app.get("/cart", async (req, res) => {
  var query = "SELECT * FROM cart WHERE userID = $1";
  var query2 = "SELECT * FROM ski_mountain WHERE id = $1";
  let id;
  console.log(req.session.user.user_id);
  await db.any(query, [req.session.user.user_id])
    .then(cart => {
      console.log(cart);
      console.log("ski mountain id " + cart[0].ski_mountainid);
      id = cart[0].ski_mountainid;
      // res.render("pages/cart", {
      //     cart: cart,
      // });
    })
    .catch(err => {
      res.render('pages/cart', {
        cart: [],
        error: true,
        message: err.message,
      });
    });

  console.log(query2 + id);
  await db.any(query2, [id])
    .then(data => {
      console.log("QUERY 2 RETURNS" );
      console.log(data);

      res.render("pages/cart", {
        data,
    });
    })
    .catch(err => {
      console.log(err)
    });
});

app.use(auth);

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(3000);
console.log("Server is listening on port 3000...");