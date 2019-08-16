///// Bot helpers class /////

class BotHelpers {
  //Greeting
  greetingMenu(){
    return [{
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
  }

  // Quick replies constructor
  quickRepliesBuilder(data, pageNumber, notNext) {
    let page = pageNumber;
    let names = [];
    if (page > 1) {
      let back = {
        'content_type': 'text',
        'title': '<<< Prev',
        'payload': `gotoCatalogPage=${page - 1}` 
      };
      names.push(back);
    }
    if (data) {
      data.forEach(item => {
        let content = {
          'content_type': 'text',
          'title': item.name,
          'payload': `category=${item.id}`
        };
        names.push(content);
      });
    }
    if (!notNext) {
      let next = {
        'content_type': 'text',
        'title': 'Next >>>',
        'payload': `gotoCatalogPage=${page + 1}`
      };
      names.push(next);
    }
    return names;
  }

  // Galery creator
  createProductsGalery(data, marker) {
    let names = [];
    data.forEach(item => {
      if (!item.images.length) {
        item.images.push({
          href: 'https://2.bp.blogspot.com/-fB3ZHgfBUNw/XMbd-eE1RAI/AAAAAAAACAw/ezVLWMXRr-cEwT3VOM5gMWOkfC1cyq6HACLcBGAs/s1600/600px-No_image_available.svg.png'
        });
      }
      let content = {
        'title': item.name,
        'image_url': item.images[0].href,
        'subtitle': item.plot ?
          `Price: $${item.salePrice}\n${item.plot}` : item.shortDescription ?
          `Price: $${item.salePrice}\n${item.shortDescription}` : `Price: $${item.salePrice}`,
        'buttons': this.createProductsButtons(data, item, marker)
      };
      names.push(content);
    });
    return names;
  }

  // buttons for product galery
  createProductsButtons(data, item, marker) {
    if(!marker){
        return [{
          'type': 'postback',
          'title': data.length > 1 ? 'Detales' : 'Buy',
          'payload': data.length > 1 ? `product=${item.sku}` : 'share_number'
        },
        {
          'type': 'postback',
          'title': 'To favorites',
          'payload': `favorite=${item.sku}&${item.name}&${item.images[0].href}`
        },
        {
          'type': 'postback',
          'title': 'Main menu',
          'payload': 'main_menu'
        }
      ];
    } else {
      return [{
        'type': 'postback',
        'title': 'Repeat?',
        'payload': `product=${item.sku}`
      },
      {
        'type': 'postback',
        'title': 'Into my order',
        'payload': 'purchases'
      },
      {
        'type': 'postback',
        'title': 'Main menu',
        'payload': 'main_menu'
      }
      ];
    }

  }

    // Create favorite galery
    createFavoriteGalery(data) {
      let elements = [];
      data.forEach(item => {
        let content = {
          'title': item.name,
          'image_url': item.image,
          'buttons': [{
            'type': 'postback',
            'title': 'Detales',
            'payload': `product=${item.sku}`
          },
          {
            'type': 'postback',
            'title': 'Main menu',
            'payload': 'main_menu'
          },
          {
            'type': 'postback',
            'title': 'Delete',
            'payload': `delete=${item.sku}`
          }
          ]
        };
        elements.push(content);
      });
      return elements;
    }
    
   // List of purchases constructor
   getMyPurchases(data, prchOffset, notNext) {
    let names = [];
    if (prchOffset >= 8) {
      let back = {
        'content_type': 'text',
        'title': '<<< Prev',
        'payload': `prchOffset=${prchOffset - 8}`
      };
      names.push(back);
    }
    data.forEach(item => {
      let content = {
        'content_type': 'text',
        'title': new Date(item.timestamp).toString().substring(0, 15),
        'payload': `product_in_purchased=${item.sku}`
      };
      names.push(content);
    });
    if (!notNext) {
      let next = {
        'content_type': 'text',
        'title': 'Next >>>',
        'payload': `prchOffset=${prchOffset + 8}`
      };
      names.push(next);
    }
    return names;
  }


  // Congrats
  congrats(message) {
    return {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': [{
          'title': message,
          'image_url': 'https://2.bp.blogspot.com/-8v7aOaOmiK4/XNLOIXYnXHI/AAAAAAAACBI/oCLnsh869dIaIo5F9JKABIk-pFVoDchGgCLcBGAs/s1600/gefeliciteerd-met-de-wenskaart_53876-82116.jpg',
          'buttons': [{
            'type': 'postback',
            'title': 'Get referral bonus',
            'payload': 'ref_bonus'
          },
          {
            'type': 'postback',
            'title': 'Main menu',
            'payload': 'main_menu'
          }
          ]
        }]
      }
    };
  }

    //Rate the product
    rating() {
      let replies = [];
      for (let i = 0; i <= 10; i++) {
        replies.push({
          'content_type': 'text',
          'title': `${i}`,
          'payload': `rate=${i}`
        });
      }
      return replies;
    }

}

module.exports = BotHelpers;