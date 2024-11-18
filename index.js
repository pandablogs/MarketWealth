import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

import mongodb from './src/models/mongodb.js';
import router from './src/controllers/router.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3200;
process.env.NODE_ENV = process.env.NODE_ENV || 'LOCAL';
console.log('ENV', process.env.NODE_ENV);

// Middleware
app.use(bodyParser.json());
app.use(compression());
app.use(express.static(path.resolve(process.cwd(), 'build')));

// Add headers
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'LOCAL') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

mongodb.connection().then((connection) => {
  if (connection) {
    router(app);
    console.log('Database connection connected....');
  } else {
    console.log('Database connection failed....');
  }

  app.get('/', async (req, res) => {
    res.send('Server Start..........');
  });

  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
});
