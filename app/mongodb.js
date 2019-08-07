const Favorite = require('./models/favorites');

class DB{
  // Check if product exists in favorites
  checkFavorite(userId, item) {
    const sku = item.split('&')[0];
    return Favorite.findOne({ 'userId': userId, 'sku': sku });
  }

  // Add new product to favorites
  addNewFavorite(userId, newFavorite, timestamp) {
    const items = newFavorite.split('&');
    const favorite = new Favorite();
    favorite.sku = items[0];
    favorite.name = items[1];
    favorite.image = items[2];
    favorite.userId = userId;
    favorite.timestamp = timestamp;
    return favorite.save();
  }

  // Fetch list of favoretes from DB
  getFavorites(userId) {
    return Favorite.find({ 'userId': userId }).sort({ timestamp: 'desc' })
  }

  //Delete item from favorites
  deleteFavotire(sku){
    return Favorite.findOneAndDelete({'sku': sku})
  }
}

module.exports = DB;