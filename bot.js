'use strict';

const express = require('express');
const app = express();
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const router = express.Router();
const http = require('http').Server(app);
const logger = require('./utils/logger');

require('dotenv').config()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}))


const botkit = require('botkit');

const controller = botkit.facebookbot({
  verify_token: process.env.VERIFY_TOKEN,
  access_token: process.env.ACCESS_TOKEN
});

const facebookBot = controller.spawn({});



controller.setupWebserver(process.env.PORT || 3000, function (err, webserver) {
  controller.createWebhookEndpoints(controller.webserver, facebookBot, function () {
    console.log('Your facebook bot is connected.');
  });
});


mongoose.connect(process.env.MONGO_DB_URI, {
  useNewUrlParser: true
});
const db = mongoose.connection;
db.on('error', error => logger.error(error.name));
db.once('open', () => logger.info('connected to mongoDB'));



require('./app/bot.setup')(controller);
require('./app/conversations')(controller, facebookBot);