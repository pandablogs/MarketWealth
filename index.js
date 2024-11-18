const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
require('dotenv').config()


const mongodb = require("./src/models/mongodb");
const router = require("./src/controllers/router");
const app = express();
const port = process.env.PORT || 3200;
process.env.NODE_ENV = process.env.NODE_ENV || 'LOCAL'
console.log('ENV', process.env.NODE_ENV)


//import File 
app.use(bodyParser.json());
//Access Fornt-end code
app.use(compression());//add this as the 1st middleware
app.use(express.static(path.resolve(__dirname, 'build')));

// Add headers before the routes are defined
app.use(function (req, res, next) {
    if (process.env.NODE_ENV == 'LOCAL') {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');


    // Pass to next layer of middleware
    next();
});


mongodb.connection().then((connection) => {

    //Connection 
    if (connection == true) {
        router(app);
        console.log("Database connection connected....");
    } else {
        console.log("Database connection failed....");
    }


    //Get Local Data API 
    app.get("/", async (req, res) => {
        res.send("Server Start..........")
    });

    app.listen(port, () => {
        console.log(`server start ${port}`);
    });
});


