require('dotenv').config()

const to = require('await-to-js').default;
const Helpers = require('./helper');
const Errors = require('./errors');
const DB = require('./mongodb');
const BestBuy = require('./bestbuy');

const bestbuy = new BestBuy();
const db = new DB();
const helpers = new Helpers();
const errorHelpers = new Errors();

let BOT_CONFIG = {
  product: {},
  catalogPageNumber: 1,
  productsPageNumber: 1,
  productId: '',
  dismiss: true
};

module.exports = controller => {

  controller.hears(['GET_STARTED', 'Почати', 'Get Started'], 'message_received,facebook_postback', async (bot, message) => {
    let [err, FBuser] = await to(bot.getMessageUser(message));
    if (err) FBuser = '';
    if (message.referral) {
      console.log('ref2')
      const [err, user] = await to(db.areYouReferralFirstTime(message.sender.id))
      if(err){
        bot.reply(message, {
          text: errorHelpers.dbError(err)
        });
      } else if (user) {
        bot.reply(message, {
          text: 'You are already registered!\nYou cannot use referral twice!',
          quick_replies: helpers.greetingMenu()
        });
      } else {
        const [err, newUser] = await to(db.saveNewUser(message.sender.id))
        if(err){
          bot.reply(message, {
            text: errorHelpers.dbError(err)
          });
        } else {
          const [err, pushToReferrals] = await to(db.pushToReferrals(message.referral.ref, message.sender.id))
          if(err){
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          } else{
            referrals(FBuser, bot, message, 'ref');
          }
        }
      }
    } else {
      console.log('ref')
      const [err, user] = await to(db.areYouReferralFirstTime(message.sender.id))
      if(err){
        bot.reply(message, {
          text: errorHelpers.dbError(err)
        });
      } else if (!user) {
        const [err, newUser] = await to(db.saveNewUser(message.sender.id))
        if(err){
          bot.reply(message, {
            text: errorHelpers.dbError(err)
          });
        } else {
          bot.reply(message, {
            text: `Hi, ${FBuser.first_name}!`,
            quick_replies: helpers.greetingMenu()
          });
        }
      } else {
        referrals(FBuser, bot, message, 'notRef');
      }
    }
  })

  controller.hears(['main_menu'], 'facebook_postback', async (bot, message) => {
    await bot.reply(message, {
      text: 'Menu',
      quick_replies: helpers.greetingMenu()
    })
  })

  controller.hears(['hi', 'hello', 'howdy', 'hey', 'aloha', 'hola', 'bonjour', 'oi'], 'message_received', async (bot, message) => {
    await bot.reply(message, 'Hey there.');
  });

  controller.hears(['Next >>>', '<<< Prev'], 'message_received,facebook_postback', async (bot, message) => {
    const [arg, page] = message.quick_reply.payload.split('=');
    switch (arg) {
      case 'gotoCatalogPage':
        BOT_CONFIG.catalogPageNumber = +page;
        catalogBuilder(bot, message, BOT_CONFIG.catalogPageNumber);
        break;
      case 'prchOffset':
        getMyPurchases(bot, message, +page);
        break;
      case 'goToProductsPage': 
        BOT_CONFIG.productsPageNumber = +page;
        productsBuilder(bot, message, BOT_CONFIG.productsPageNumber, BOT_CONFIG.productId)
        break;
      case 'goToFavoritePage':
        getMyFavorites(bot, message, page)
      }

  });

  controller.hears(['catalog', 'Shop'], 'message_received,facebook_postback', async (bot, message) => {
    BOT_CONFIG.catalogPageNumber = 1;
    catalogBuilder(bot, message, BOT_CONFIG.catalogPageNumber);
  });

  controller.hears(['purchases', 'favorites', 'invite'], 'message_received,facebook_postback', async (bot, message) => {
    const arg = message.quick_reply ? message.quick_reply.payload : message.postback.payload;
    switch (arg) {
      case 'favorites':
        getMyFavorites(bot, message, 1);
        break;
      case 'purchases':
        getMyPurchases(bot, message, 0);
        break;
      case 'invite':
        controller.api.messenger_profile.get_messenger_code(2000, (err, url) => {
          if (err) {
            throw (err);
          } else {
            bot.reply(message, {
              text: `Send link or image to 3 friend, and get one product for free!`
            });
            bot.reply(message, {
              text: `${process.env.BOT_URI}?ref=${message.sender.id}`
            });
            bot.reply(message, {
              attachment: {
                'type': 'image',
                'payload': {url}
              }
            });
          }
        }, message.sender.id);
        break;
    }
  });

  controller.hears([/^(\s*)?(\+)?([- _():=+]?\d[- _():=+]?){10,14}(\s*)?$/], 'message_received', async (bot, message) => {
    BOT_CONFIG.product.phone = message.text;
    BOT_CONFIG.product.userId = message.sender.id;
    bot.startConversation(message, (err, convo) => {
      if (err) throw err;
      convo.ask({
        text: 'Share your location',
        quick_replies: [{
          'content_type': 'location'
        }],
        payload: 'location'
      }, async (response, convo) => {
        if (response && response.attachments) {
          BOT_CONFIG.product.coordinates = response.attachments[0].payload.coordinates;
          BOT_CONFIG.product.timestamp = response.timestamp;
          let [err, data] = await to(db.savePurchase(BOT_CONFIG.product))
          if(err){
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          } else{
            convo.say('Our courier will contact you within 2 hours');
          }
          [err, data] = await to(db.addCron(message.sender.id, response.timestamp))
          if(err){
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          }else {
            convo.next();
          }

        } else {
          convo.next();
        }
      });
    }, (response, convo) => {
      convo.next();
    });
  });

  controller.hears('(.*)', 'message_received,facebook_postback', async (bot, message) => {
    if (message.quick_reply) {
      let err, response;
      const [arg, payload] = message.quick_reply.payload.split('=');
      switch (arg) {
        case 'product_in_purchased':
          [err, response] = await to(bestbuy.getProductDetales(payload))
          if (err) {
            bot.reply(message, {
              text: errorHelpers.bestBuyError(err)
            });
          } else {
            bot.reply(message, {
              attachment: {
                'type': 'template',
                'payload': {
                  'template_type': 'generic',
                  'elements': helpers.createProductsGalery([response], true)
                }
              }
            });
          }
          break;
        case 'category':
          BOT_CONFIG.productsPageNumber = 1;
          BOT_CONFIG.productId = payload;
          productsBuilder(bot, message, BOT_CONFIG.productsPageNumber, BOT_CONFIG.productId)
          break;
        case 'rate':
          [err, response] = await to(db.checkRate(message.sender.id))
          if (err) {
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          } else if (!response) {
            [err, response] = await to(db.addRate(message.sender.id, +payload))
            if (err) {
              bot.reply(message, {
                text: errorHelpers.dbError(err)
              });
            }
          } else {
            [err, response] = await to(db.updateRate(message.sender.id, +payload))
            if (err) {
              bot.reply(message, {
                text: errorHelpers.dbError(err)
              });
            }
          }
          bot.reply(message, {
            text: 'Thank you!'
          });
          [err, response] = await to(db.deleteCron(message.sender.id))
          if (err) {
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          }
          break;
      }
    }
    if (message.postback) {
      const [arg, payload] = message.postback.payload.split('=');
      let err, response;
      switch (arg) {
        case 'product':
          [err, response] = await to(bestbuy.getProductDetales(payload))
          if(err){
            bot.reply(message, {
              text: errorHelpers.bestBuyError(err)
            });
          } else if (!response) {
            bot.reply(message, {
              text: 'No such product'
            });
          } else {
            BOT_CONFIG.product.sku = response.sku;
            BOT_CONFIG.product.userId = message.sender.id;
            bot.reply(message, {
              attachment: {
                'type': 'template',
                'payload': {
                  'template_type': 'generic',
                  'elements': helpers.createProductsGalery([response], false)
                }
              }
            });
          }
          break;

        case 'favorite':
          [err, response] = await to(db.checkFavorite(message.sender.id, payload))
          if(err){
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          } else if (response) {
            bot.reply(message, {
              text: `"${response.name}"\nis already in favorite list`,
              quick_replies: [{
                'content_type': 'text',
                'title': 'Show favorites',
                'payload': 'favorites'
              }]
            });
          } else {
            [err, response] = await to(db.addNewFavorite(message.sender.id, payload, message.timestamp))
            if(err){
              bot.reply(message, {
                text: errorHelpers.dbError(err)
              });
            } else {
              bot.reply(message, {
                text: 'Added to favorites',
                quick_replies: [{
                  'content_type': 'text',
                  'title': 'Show favorites',
                  'payload': 'favorites'
                }]
              });
            }
          }
          break;
        case 'delete':
          [err, response] = await to(db.deleteFavotire(message.sender.id, payload))
          if(err){
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          } else {
            bot.reply(message, {
              text: 'Deleted from favorites',
              quick_replies: [{
                'content_type': 'text',
                'title': 'Show favorites',
                'payload': 'favorites'
              }]
            });
          }
          break;
        case 'share_number':
          await bot.reply(message, {
            text: 'Share your phone number',
            quick_replies: [{
                'content_type': 'user_phone_number'
            }],
            payload: 'user_phone'
          });
          break;
      }
    }
  })

}

///// Catalog builder /////
async function catalogBuilder(bot, message, pageNumber) {
  const [err, data] = await to(bestbuy.getCatalog(pageNumber))
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
      quick_replies: helpers.quickRepliesBuilder(data.categories, BOT_CONFIG.catalogPageNumber, 'catalog', data.to == data.total ? true : false)
    });
  }
}

///// Products builder ////
async function productsBuilder(bot, message, page, id){
  [err, response] = await to(bestbuy.getProductsFromCatalog(id, page))
  if (err) {
    bot.reply(message, {
      text: errorHelpers.bestBuyError(err)
    });
  } else if (!response.products.length) {
    bot.reply(message, {
      text: 'This catalog is currently empty, please try another',
    });
  } else {
    bot.reply(message, {
      attachment: {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': helpers.createProductsGalery(response.products, false, BOT_CONFIG.productsPageNumber)
        }
      }
    });
    prevNext(bot, message, 'product', BOT_CONFIG.productsPageNumber, response.to === response.total ? true : false);
  }
}

///// Get favorites /////
async function getMyFavorites(bot, message, page) {
  let notNext = false;
  const [err, result] = await to(db.getFavorites(message.sender.id, page))
  if(result.length < 8) notNext = true;
  if (err) {
    bot.reply(message, {
      text: errorHelpers.dbError(err)
    });
  } else if (!result.length) {
    bot.reply(message, {
      text: 'You have nothing in favorites yet'
    });
  } else {
    bot.reply(message, {
      attachment: {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': helpers.createFavoriteGalery(result)
        }
      }
    });
    prevNext(bot, message, 'favorite', page, notNext);
  }
}

///// Get purchases /////
async function getMyPurchases(bot, message, prchOffset) {
  let notNext = false;
  const [err, purchases] = await to(db.getPurchases(message.sender.id, prchOffset));
  if (purchases.length < 8) notNext = true;
  if (err) {
    bot.reply(message, {
      text: errorHelpers.dbError(err)
    });
  } else if (!purchases.length) {
    bot.reply(message, {
      text: 'You have no purchases yet'
    });
  } else {
    bot.reply(message, {
      text: 'Purchases list',
      quick_replies: helpers.getMyPurchases(purchases, prchOffset, notNext)
    });
  }
}

///// Referrals /////
async function referrals(FBuser, bot, message, keyword) {
  const [err, referrals] = await to(db.getReferrals(keyword === 'ref' ? message.referral.ref : message.sender.id));
  if (err) {
    bot.reply(message, {
      text: errorHelpers.dbError(err)
    });
  } else {
    let refCounter = referrals.referrals.length;
    if (keyword === 'ref') {
      if (refCounter % 3 !== 0) BOT_CONFIG.dismiss = true;
      if (refCounter !== 0 && refCounter % 3 === 0 && BOT_CONFIG.dismiss) {
        bot.say({
          channel: message.referral.ref,
          text: `Congratulations, you have involved 3 new user\nNavigate to "Main menu" to get your bonus`
        });
      }
      bot.reply(message, {
        attachment: helpers.congrats(`Hi, ${FBuser.first_name}, congrats! You have activated promo link. Get some bonuses!`)
      });
    } else {
      if (refCounter % 3 !== 0) BOT_CONFIG.dismiss = true;
      if (refCounter !== 0 && refCounter % 3 === 0 && BOT_CONFIG.dismiss) {
        BOT_CONFIG.dismiss = false;
        bot.reply(message, {
          attachment: helpers.congrats(`Congratulations, ${FBuser.first_name}, you have involved 3 new user. Get a product for free!`)
        });
      } else {
        bot.reply(message, {
          text: `Welcome back, ${FBuser.first_name}! Nice to see you again!`,
          quick_replies: helpers.greetingMenu()
        });
      }
    }
  }
}

///// Prev Next navigation
function prevNext(bot, message, modifier, pageNumber, notNext) {
  setTimeout(() => {
    bot.reply(message, {
      text: 'Use navigation buttons below',
      quick_replies: helpers.quickRepliesBuilder(false, pageNumber, modifier, notNext)
    });
  }, 1000);
}