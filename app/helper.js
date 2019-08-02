///// Bot helpers class /////

class BotHelpers {

  // Quick replies constructor
  quickRepliesBuilder(data, pageNumber, modifier, notNext) {
    let page = pageNumber;
    let names = [];
    if (page > 1) {
      let back = {
        'content_type': 'text',
        'title': '<<< Prev',
        'payload': modifier === 'catalog' ?
          `gotoCatalogPage=${page - 1}` : modifier === 'favorite' ?
          `goToFavoritePage?=${page - 1}` : `show_products&page?=${page - 1}`
      };
      names.push(back);
    }
    if (data) {
      data.forEach(item => {
        let content = {
          'content_type': 'text',
          'title': item.name,
          'payload': `category?=${item.id}`
        };
        names.push(content);
      });
    }
    if (!notNext) {
      let next = {
        'content_type': 'text',
        'title': 'Next >>>',
        'payload': modifier === 'catalog' ?
          `gotoCatalogPage=${page + 1}` : modifier === 'favorite' ?
          `goToFavoritePage?=${page + 1}` : `show_products&page?=${page + 1}`
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
          'payload':`product?=${item.sku}` 
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

}

module.exports = BotHelpers;