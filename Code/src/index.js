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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('pages/login');
  });
  

const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/register");
    }
    next();
};

app.use(auth);


app.listen(3000);
console.log("Server is listening on port 3000...");
