const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rate = new Schema({
    userId: String,
    rate: Number
})

module.exports = mongoose.model('Rating', rate, 'ratings');