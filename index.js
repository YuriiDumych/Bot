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

var facebookController = botkit.facebookbot({
  verify_token: process.env.FB_VERIFY_TOKEN,
  access_token: process.env.FB_ACCESS_TOKEN,
  stats_optout: true
});

var facebookBot = facebookController.spawn({});

facebookController.setupWebserver("8080",function(err,webserver) {
  facebookController.createWebhookEndpoints(facebookController.webserver, facebookBot, function() {
      console.log('Your facebook bot is connected.');
  });
});


facebookController.hears(['hello'], 'message_received', function(bot, message) {

  bot.reply(message, 'Hey there.');

});
facebookController.api.thread_settings.greeting("WELCOME TO BOTKIT CHAT");
facebookController.api.thread_settings.get_started('GET_STARTED');


facebookController.hears(['favorites'], 'message_received', function(bot, message){

})
facebookController.hears(['GET_STARTED'], 'facebook_postback', function(bot, message){
  var questionText = 'Started'
    var replies = [
      {
      "content_type":"text",
      "title":'My purchases',
      "payload":'purchases'
      },
      {
      "content_type":"text",
      "title":'Shop',
      "payload":'shop'
      },
      {
      "content_type":"text",
      "title":'Favorites',
      "payload":'favorites'
      },
      {
      "content_type":"text",
      "title":'To invite a friend',
      "payload":'invite'
      }
    ]
    var quickReplyAttachment = {
      'text': questionText,
      'quick_replies': replies
    }
     bot.reply(message, quickReplyAttachment)
})

facebookController.api.messenger_profile.menu(
  [
    { 
      "locale":"default", 
      "composer_input_disabled":false, 
      "call_to_actions":
          [ 
            { 
              "title":"Main menu", 
              "type":"nested", 
              "call_to_actions":
              [ 
                { 
                  "title":'My purchases',
                  "type":"postback", 
                  "payload":"purchases" 
                }, 
                { 
                  "title":'Shop',
                  "type":"postback", 
                  "payload":"shop" 
                },
                {
                  "title":'Favorites',
                  "type":"postback",
                  "payload":'favorites'
                },
                { 
                  "title":'To invite a friend',
                  "type":"postback", 
                  "payload":'invite'
                } 
              ] 
          }, 
          { 
            "type":"postback", 
            "title":"Product catalog", 
            "payload":"catalog"
          } 
        ] 
  
    }, 
    { "locale":"zh_CN", "composer_input_disabled":false }
  ]
);

