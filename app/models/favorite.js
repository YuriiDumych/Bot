const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favorite = new Schema({
    sku: Number,
    name: String,
    image: String,
    userId: String,
    timestamp: Date
})

module.exports = mongoose.model('Favorite', favorite, 'favorites');