'use strict';

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var router = express.Router();
var http = require('http').Server(app);


require('dotenv').config()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}))


var botkit = require('botkit');

var controller = botkit.facebookbot({
  verify_token: process.env.VERIFY_TOKEN,
  access_token: process.env.ACCESS_TOKEN
});

var facebookBot = controller.spawn({});

controller.setupWebserver("8080", function (err, webserver) {
  controller.createWebhookEndpoints(controller.webserver, facebookBot, function () {
    console.log('Your facebook bot is connected.');
  });
});


require('./app/bot.setup')(controller);
require('./app/conversations')(controller);