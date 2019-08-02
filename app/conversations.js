require('dotenv').config()

const bby = require('bestbuy')(`${process.env.BEST_BUY_API_KEY}`);
const Helpers = require('./helper');
const helpers = new Helpers();
const Errors = require('./errors');
const errorHelpers = new Errors();


const BOT_CONFIG = {
  product: {},
  catalogPageNumber: 1,
  categoryPageNumber: 1,
  productsPageNumber: 1,
};

module.exports = controller => {
  controller.hears(['GET_STARTED', 'main_menu'], 'facebook_postback', async (bot, message) => {
    let questionText = message.payload === 'GET_STARTED' ? 'How can I help you?' : 'Main menu';
    let replies = [{
        "content_type": "text",
        "title": 'My purchases',
        "payload": 'purchases'
      },
      {
        "content_type": "text",
        "title": 'Shop',
        "payload": 'shop'
      },
      {
        "content_type": "text",
        "title": 'Favorites',
        "payload": 'favorites'
      },
      {
        "content_type": "text",
        "title": 'To invite a friend',
        "payload": 'invite'
      }
    ]
    let quickReplyAttachment = {
      'text': questionText,
      'quick_replies': replies
    }
    await bot.reply(message, quickReplyAttachment)
  })

  controller.hears(['hi', 'hello', 'howdy', 'hey', 'aloha', 'hola', 'bonjour', 'oi'], 'message_received', async (bot, message) => {
    await bot.reply(message, 'Hey there.');
  });

  controller.hears(['Shop', 'Next >>>', '<<< Prev'], 'message_received,facebook_postback', async (bot, message) => {
    if (message.quick_reply) {
      const [arg, page] = message.quick_reply.payload.split('=');
      switch (arg) {
        case 'gotoCatalogPage':
          BOT_CONFIG.catalogPageNumber = +page;
          catalogBuilder(bot, message, BOT_CONFIG.catalogPageNumber);
          break;
      }

    }
  });

  controller.hears(['catalog'], 'facebook_postback', async (bot, message) => {
    BOT_CONFIG.catalogPageNumber = 1;
    catalogBuilder(bot, message, BOT_CONFIG.catalogPageNumber);
  });

  controller.hears('(.*)', 'message_received,facebook_postback', async (bot, message) => {
    if (message.quick_reply) {
      const [arg, payload] = message.quick_reply.payload.split('=');
      switch (arg) {
        case 'category?':
          await bby.products(`categoryPath.id=${payload}`, (err, data) => {
            if (err) {
              bot.reply(message, {
                text: errorHelpers.bestBuyError(err)
              });
            } else if (!data.products.length) {
              bot.reply(message, {
                text: 'This catalog is currently empty, please try another',
              });

            } else {
              bot.reply(message, {
                attachment: {
                  'type': 'template',
                  'payload': {
                    'template_type': 'generic',
                    'elements': helpers.createProductsGalery(data.products, false)
                  }
                }
              });
            }
          })
          break;

      }
    }
    if (message.postback) {
      const [arg, payload] = message.postback.payload.split('=');
      switch (arg) {
        case 'product?':
          bby.products(+payload, (err, data) => {
            //     console.log('data',data)
            //     if (err) {
            //       bot.reply(message, {
            //                     text: errorHelpers.bestBuyError(err)
            //                   });
            //                 } else if (data === undefined) {
            //       bot.reply(message, {
            //                     text: 'No such product'
            //                   });
            //                 } else {
            //       BOT_CONFIG.product.sku = response.sku;
            //       BOT_CONFIG.product.userId = message.sender.id;
            //       bot.reply(message, {
            //                     attachment: {
            //       'type': 'template',
            //       'payload': {
            //       'template_type': 'generic',
            //       'elements': helpers.createProductsGalery([data], false)
            //                       }
            //                     }
            //                   });
            //                 }          
            bot.reply(message, {
              attachment: {
                'type': 'template',
                'payload': {
                  'template_type': 'generic',
                  'elements': helpers.createProductsGalery([data], false)
                }
              }
            });
          })

          break;
      }
    }
  })
}

///// Catalog builder /////
async function catalogBuilder(bot, message, pageNumber) {
  bby.categories('', {
    pageSize: 4,
    page: BOT_CONFIG.catalogPageNumber
  }, (err, data) => {
    if (err) {
      bot.reply(message, {
        text: errorHelpers.bestBuyError(err)
      });
    } else if (!data.categories.length) {
      bot.reply(message, {
        text: 'There are no categories in this catalogue'
      });
    } else {
      bot.reply(message, {
        text: 'Send catalogue',
        quick_replies: helpers.quickRepliesBuilder(data.categories, BOT_CONFIG.catalogPageNumber, 'catalog', false)
      });
    }
  })

}

