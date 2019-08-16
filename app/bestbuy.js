require('dotenv').config();
const bby = require('bestbuy')(process.env.BEST_BUY_API_KEY);

class BestBuy{

    //categories
    getCatalog(page){
        return bby.categories('', {page: page, pageSize: 8})
     }
    //products
    getProductsFromCatalog(id){
        return bby.products(`categoryPath.id=${id}`)
    }
    //dateles
    getProductDetales(sku){
        return bby.products(+sku)
    }
}

module.exports = BestBuy;