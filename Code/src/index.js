const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

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

app.set("view engine", "ejs");
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

// Redirect '/' to '/login'.
app.get("/", (req, res) => {
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.render("pages/login");
});

app.post("/login", async (req, res) => {
    const query = `select * from users where username = $1;`;
    db.any(query, [req.body.username])
        .then(async user => {
            bcrypt.compare(req.body.password, user[0].password)
                .then(match => {
                    if (!match) {
                        throw new Error("Incorrect username or password.");
                    }else{
                        req.session.userID=user.id;
                        req.session.save();
                    }
                })
                .catch(err => {
                    res.render("pages/login", {
                        error: true,
                        message: err.message
                    })
                })
        })
        .catch(err => {
            console.log(err);
            res.render("pages/login", {
                error: true,
                message: "Incorrect username or password."
            });
        })
});

app.get("/profile", (req, res) => {
    res.render("pages/profile");
});

app.get("/cart", (req, res) => {
    var query = "SELECT * FROM cart WHERE userID = $1";
   // console.log(query);

    db.any(query, [req.session.userID])
      .then(cart => {
        console.log(cart.userID);
        res.render("pages/cart", {
            cart: cart,
        });
      })
      .catch(err => {
        res.render('pages/cart', {
          cart: [],
          error: true,
          message: err.message,
        });
      });
});



app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('pages/login');
  });
  

const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/cart");
    }
    next();
};

app.use(auth);


app.listen(3000);
console.log("Server is listening on port 3000...");
