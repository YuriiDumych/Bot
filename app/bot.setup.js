require('dotenv').config();

function botSetup(controller) {

    controller.api.thread_settings.greeting("WELCOME TO BOTKIT CHAT");
    controller.api.thread_settings.get_started('GET_STARTED');
    controller.api.messenger_profile.menu(
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

}

module.exports = botSetup;