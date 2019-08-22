'use strict';

const express = require('express');
const app = express();
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const router = express.Router();
const http = require('http').Server(app);
const logger = require('./utils/logger');

require('dotenv').config()



const Helpers = require('./app/helper');
const DB = require('./app/mongodb');

const database = new DB();
const helpers = new Helpers();
var CronJob = require('cron').CronJob;




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}))


const botkit = require('botkit');

const controller = botkit.facebookbot({
  verify_token: process.env.VERIFY_TOKEN,
  access_token: 'EAAGGcstxntIBABGpSyPiBJ30TZAofwYB3RzuMlhimVob9u30QdH7LRaWrCsIuoSbjkUyr3ih5SaZBkDCJwnkMbax5dsQ2N0ZAVeRx4Y7BMaZAZCImgcehksdY0ZBhfZBsOiNPMCUnR5WKWnZBhdm9zA1UD5GPWlqEnMMa7DcDafZBRgZDZD',
  stats_optout: true
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
require('./app/conversations')(controller);


database.getCrons()
  .then(data => {
    if(data.length){
      data.forEach(item => {
        if(item.time > new Date()){
          new CronJob(item.time, () => {
            facebookBot.say({
              channel: item.userId,
              text: 'Please rate the product\nHow do you estimate, recommend our product to your friends?', 
              quick_replies: helpers.rating()
            })
          }, null, true);
        } else {
          facebookBot.say({
            channel: item.userId,
            text: 'Please rate the product\nHow do you estimate, recommend our product to your friends?', 
            quick_replies: helpers.rating()
          })
        }
      })
    }
    
  })