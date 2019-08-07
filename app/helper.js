///// Bot helpers class /////

class BotHelpers {

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
  createProductsGalery(data) {
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
        'buttons': this.createProductsButtons(data, item)
      };
      names.push(content);
    });
    return names;
  }

  // buttons for product galery
  createProductsButtons(data, item) {
      return [{
          'type': 'postback',
          'title': data.length > 1 ? 'Detales' : 'BUY',
          'payload':`product=${item.sku}` 
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
}

module.exports = BotHelpers;