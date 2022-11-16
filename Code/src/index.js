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



let token = 'null';
const axios = require("axios");

/*
const getHotel = async (lat, long) => {
    let url = 'test.api.amadeus.com/reference-data/locations/hotels/by-geocode' +
    lat + "," + long + "," + 15;
    return await axios
    .get(url)
    .then((res) => {

        res.data;
        console.log(res.data)
    }
        )
    .catch(function (error) {
      console.log(error);
    });
    
}

*/
const Accessurl = 
    {
        url: "https://test.api.amadeus.com/v1/security/oauth2/token",
        raw_url: "https://test.api.amadeus.com/v1/security/oauth2/token",
        method: "post",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
            "grant_type": "client_credentials",
            "client_id": "KRGf6smGxGSlIkpof8ijvVA3N55JuWmE",
            "client_secret": "Q4rzCo7EwV1AvFYu"
        }
    }

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

//app.use(getHotel);

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('pages/login');
  });

  app.post("/discovery", async (req, res) => {
    
  });
  app.get('/discovery', (req, res) => {
    req.session.user = {
        api_key: process.env.API_KEY,
      };
      req.session.save();
     
      axios(Accessurl).then((results)=>{                                //api call to refresh access token 
        token = results.data.access_token;
        console.log(token);

       }).finally(() =>{

        axios({
            url : 'https://test.api.amadeus.com/v1//reference-data/locations/hotels/by-geocode',            //api to get hotels using access token
           method: 'GET',
           dataType:'json',
           headers: {
               "Authorization" : 'Bearer ' + token
           },
           params: {
               "latitude":40.01925,
               "longitude":-105.2640669
           }
        }).then((results) => {
            console.log(token);
            //console.log("Succes",results.data.data)
            res.render("pages/discovery",{data: results.data.data});
            
        }
            )
        .catch(function (error) {
            console.log(token);
          //console.log(error);
        })
       }).catch(function (error) {
          console.log(error);
        })
  });
  

const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/discovery");
    }
    next();
};

app.use(auth);


app.listen(3000);
console.log("Server is listening on port 3000...");
