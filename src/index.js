const express = require('express');
const cors = require('cors');
require("dotenv-safe").config();
const jwt = require("jsonwebtoken");
const testConnect = require('./db/testeConnect');

class AppController {
  constructor() {
    this.express = express();
    this.middlewares();
    this.routes();
    testConnect();
  }

  middlewares() {
    // Faz o parse de JSON garantindo codificação UTF-8
    this.express.use(express.json({ type: 'application/json; charset=utf-8' }));

    // Libera acesso CORS
    this.express.use(cors());

    // Força as respostas a serem enviadas em UTF-8
    this.express.use((req, res, next) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      next();
    });
  }

  routes() {
    const apiRoutes = require('./routes/apiRoutes');
    this.express.use('/api', apiRoutes);
  }
}

module.exports = new AppController().express;
