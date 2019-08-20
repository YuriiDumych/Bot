const Favorite = require('./models/favorite');
const Purchase = require('./models/purchase');
const User = require('./models/user');
const Rating = require('./models/rating');
const Cron = require('./models/cron');

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
  deleteFavotire(userId, sku){
    return Favorite.findOneAndDelete({'userId': userId, 'sku': sku})
  }

  // Save purchase
  savePurchase(product) {
    const purchase = new Purchase();
    purchase.userId = product.userId;
    purchase.sku = product.sku;
    purchase.phone = product.phone;
    purchase.coordinates = product.coordinates;
    purchase.timestamp = product.timestamp;
    return purchase.save();
  }

  //Fetch purchases
  getPurchases(id, prchOffset){
    return Purchase.find({'userId': id}).sort({timestamp: 'desc'}).skip(prchOffset).limit(8);
  }

  //Check referrals
  areYouReferralFirstTime(id){
    return User.findOne({'userId': id});
  }
  
  // Save to referrals
  pushToReferrals(refEmitterId, newUserId) {
    return User.updateOne({ 'userId': refEmitterId }, { $addToSet: { 'referrals': newUserId } });
  }

  // Get referral users
  getReferrals(userId) {
    return User.findOne({ 'userId': userId }, { 'referrals': 1 });
  }

  //Save user
  saveNewUser(id){
    const user = new User();
    user.userId = id;
    user.referrals = [];
    return user.save();
  }

  //Add cron
  addCron(id, time){
    const cron = new Cron();
    cron.userId = id;
    cron.time = time + (1000 * 60 * 60 * 24 *2);
    return cron.save();
  }

  //Get crons
  getCrons(){
    return Cron.find({});
  }

  //Delete cron
  deleteCron(userId){
    return Cron.findOneAndDelete({'userId': userId}, {sort: {'time': 1}})
  }
  // Check if rate exists 
  checkRate(userId){
    return Rating.findOne({'userId': userId});
  }
  //addRate
  addRate(userId, num){
    const rate = new Rating();
    rate.userId = userId;
    rate.rate = num;
    return rate.save();
  }
  //Update rate
  updateRate(userId, num){
    return Rating.updateOne({'userId': userId}, {'rate': num})
  }
}

module.exports = DB;