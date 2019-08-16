
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user = new Schema({
  userId: String,
  referrals: Array
});

module.exports = mongoose.model('User', user, 'users');