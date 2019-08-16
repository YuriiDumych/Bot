require('dotenv').config()

const Helpers = require('./helper');
const Errors = require('./errors');
const DB = require('./mongodb');
const BestBuy = require('./bestbuy');
const cron = require('node-cron');

const bestbuy = new BestBuy();
const db = new DB();
const helpers = new Helpers();
const errorHelpers = new Errors();

let BOT_CONFIG = {
  product: {},
  catalogPageNumber: 1
};

module.exports = (controller, facebookBot) => {
  cron.schedule('* * */8 * * *', () => {
    db.getCrons()
      .then(data => {
        if(data.length){
          data.forEach(item => {
            if(new Date() > item.time){
              facebookBot.say({
                channel: item.userId,
                text: 'Please rate the product\nHow do you estimate, recommend our product to your friends?', 
                quick_replies: helpers.rating()
              })
            }
          })
        }
      })
      .catch(err => {
        facebookBot.say(message, {
          text: errorHelpers.dbError(err)
        });
      })
  });

  controller.hears(['GET_STARTED', 'Почати'], 'facebook_postback', async (bot, message) => {
    let FBuser;
    await bot.getMessageUser(message)
      .then(data => FBuser = data)
      .catch(err => FBuser = '')

    if (message.referral) {
      console.log('ref2')
      await db.areYouReferralFirstTime(message.sender.id)
        .then(user => {
          if (user) {
            bot.reply(message, {
              text: 'You are already registered!\nYou cannot use referral twice!',
              quick_replies: helpers.greetingMenu()
            });
            return Promise.reject();
          } else {
            return db.saveNewUser(message.sender.id)
          }
        })
        .then(newUser => {
          return db.pushToReferrals(message.referral.ref, message.sender.id)
        })
        .then(result => {
          referrals(FBuser, bot, message, 'ref');
        })
        .catch(err => {
          if(err){
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          }
        })
    } else {
      console.log('ref')
      await db.areYouReferralFirstTime(message.sender.id)
        .then(user => {
          if (!user) {
            return db.saveNewUser(message.sender.id)
          } else {
            referrals(FBuser, bot, message, 'notRef');
            return Promise.reject();
          }
        })
        .then(result => {
          bot.reply(message, {
            text: `Hi, ${FBuser.first_name}!`,
            quick_replies: helpers.greetingMenu()
          });
        })
        .catch(err => {
          if (err) {
            bot.reply(message, {
              text: errorHelpers.dbError(err)
            });
          }
        })
    }
  })

  controller.hears(['main_menu'], 'facebook_postback', async(bot, message) => {
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
        getMyFavorites(bot, message);
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
                  'payload': {
                    url
                  }
                }
              });
            }
          }, 'billboard-ad');
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
          db.savePurchase(BOT_CONFIG.product)
            .then(save => {
              convo.say('Our courier will contact you within 2 hours');
              convo.next();
            })
            .catch(err => {
              bot.reply(message, {
                text: errorHelpers.dbError(err)
              });
            })
          db.addCron(message.sender.id, response.timestamp)
            .catch(err => {
              bot.reply(message, {
                text: errorHelpers.dbError(err)
              });
            })
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
      const [arg, payload] = message.quick_reply.payload.split('=');
      switch (arg) {
        case 'product_in_purchased':
          await bestbuy.getProductDetales(payload)
            .then(response => {
              bot.reply(message, {
                attachment: {
                  'type': 'template',
                  'payload': {
                    'template_type': 'generic',
                    'elements': helpers.createProductsGalery([response], true)
                  }
                }
              });
            })
            .catch(err => {
              bot.reply(message, {
                text: errorHelpers.bestBuyError(err)
              });
            })
          break;
        case 'category':
          await bestbuy.getProductsFromCatalog(payload)
            .then(data => {
              if (!data.products.length) {
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
            .catch(err => {
              bot.reply(message, {
                text: errorHelpers.bestBuyError(err)
              });
            })
          break;
        case 'rate':
          await db.checkRate(message.sender.id)
            .then(result => {
              if(!result){
                return db.addRate(message.sender.id, +payload)
              } else {
                return db.updateRate(message.sender.id, +payload)
              }
            })
            .then(result => {
              bot.reply(message, {
                text: 'Thank you!'
              });
              return db.deleteCron(message.sender.id)
            })
            .catch(err => {
              bot.reply(message, {
                text: errorHelpers.dbError(err)
              });
            })
          // await db.deleteCron(message.sender.id)
          //   .catch(err => {
          //     bot.reply(message, {
          //       text: errorHelpers.dbError(err)
          //     });
          //   })
        break;
      }
    }
    if (message.postback) {
      const [arg, payload] = message.postback.payload.split('=');
      switch (arg) {
        case 'product':
          await bestbuy.getProductDetales(payload)
            .then(data => {
              if (data === undefined) {
                bot.reply(message, {
                  text: 'No such product'
                });
              } else {
                BOT_CONFIG.product.sku = data.sku;
                BOT_CONFIG.product.userId = message.sender.id;
                bot.reply(message, {
                  attachment: {
                    'type': 'template',
                    'payload': {
                      'template_type': 'generic',
                      'elements': helpers.createProductsGalery([data], false)
                    }
                  }
                });
              }
            })
            .catch(err => {
              bot.reply(message, {
                text: errorHelpers.bestBuyError(err)
              });
            })
          break;

        case 'favorite':
          await db.checkFavorite(message.sender.id, payload)
            .then(result => {
              if (result) {
                bot.reply(message, {
                  text: `"${result.name}"\nis already in favorite list`,
                  quick_replies: [{
                    'content_type': 'text',
                    'title': 'Show favorites',
                    'payload': 'favorites'
                  }]
                });
                return Promise.reject()
              } else {
                return db.addNewFavorite(message.sender.id, payload, message.timestamp);
              }
            })
            .then(result => {
              bot.reply(message, {
                text: 'Added to favorites',
                quick_replies: [{
                  'content_type': 'text',
                  'title': 'Show favorites',
                  'payload': 'favorites'
                }]
              });
            })
            .catch(error => {
              if (error) {
                bot.reply(message, {
                  text: errorHelpers.dbError(error)
                });
              }
            })
          break;
        case 'delete':
          await db.deleteFavotire(payload)
            .then(result => {
              bot.reply(message, {
                text: 'Deleted from favorites',
                quick_replies: [{
                  'content_type': 'text',
                  'title': 'Show favorites',
                  'payload': 'favorites'
                }]
              });
            })
            .catch(error => {
              bot.reply(message, {
                text: errorHelpers.dbError(error)
              });
            })
          break;
        case 'share_number':
          bot.reply(message, {
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
  await bestbuy.getCatalog(pageNumber)
    .then(data => {
      if (!data.categories.length) {
        bot.reply(message, {
          text: 'There are no categories in this catalogue'
        });
      } else {
        bot.reply(message, {
          text: 'Send catalogue',
          quick_replies: helpers.quickRepliesBuilder(data.categories, BOT_CONFIG.catalogPageNumber, data.to == data.total ? true : false)
        });
      }
    })
    .catch(err => {
      bot.reply(message, {
        text: errorHelpers.bestBuyError(err)
      });
    })
}

///// Get favorites /////
async function getMyFavorites(bot, message) {
  await db.getFavorites(message.sender.id)
    .then(result => {
      if (!result.length) {
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
      }
    })
    .catch(error => {
      bot.reply(message, {
        text: errorHelpers.dbError(error)
      });
    })
}

///// Get purchases /////
async function getMyPurchases(bot, message, prchOffset) {
  let notNext = false;
  db.getPurchases(message.sender.id, prchOffset)
    .then(purchases => {
      if (purchases.length < 8) notNext = true;
      if (!purchases.length) {
        bot.reply(message, {
          text: 'You have no purchases yet'
        });
      } else {
        bot.reply(message, {
          text: 'Purchases list',
          quick_replies: helpers.getMyPurchases(purchases, prchOffset, notNext)
        });
      }
    })
    .catch(err => {
      bot.reply(message, {
        text: errorHelpers.dbError(err)
      });
    })
}

///// Referrals /////
async function referrals(FBuser, bot, message, keyword) {
  db.getReferrals(keyword === 'ref' ? message.referral.ref : message.sender.id)
    .then(referrals => {
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
    })
    .catch(err => {
      bot.reply(message, {
        text: errorHelpers.dbError(err)
      });
    })
}