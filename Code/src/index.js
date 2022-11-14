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

app.get('/filter', function (req, res) {
    var dif= Boolean(req.body.difficulty);
    var avg= Boolean(req.body.avg_rating);
    var ele= Boolean(req.body.elevation_gain);
    var loc= String(req.body.location);
    
    var query="SELECT * from users";
    var notFirst=0;
    var check=0;

    if(loc!=""){
        query+=" WHERE location = $1";
        check=1;
    }
    if(dif==1){
        if(notFirst==0)query+=" ORDER BY";
        query+=" difficulty DESC";
        notFirst=1;
    }
    if(avg==1){
        if(notFirst==0)query+=" ORDER BY";
        if(notFirst==1) query+=",";
        query+=" avg_rating DESC";
        notFirst=1;
    }
    if(ele==1){
        if(notFirst==0)query+=" ORDER BY";
        if(notFirst==1) query+=",";
        query+=" elevation_gain DESC";
        notFirst=1;
    }
    query+=";";
    if(check==1){
        db.any(query,[req.body.location])
        .then(function (rows) {
        res.send(rows);
        })
        .catch(function (err) {
        console.log(err);
        });
    }
    else{
        db.any(query)
        .then(function (rows) {
        res.send(rows);
        })
        .catch(function (err) {
        console.log(err);
        });
    }
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
