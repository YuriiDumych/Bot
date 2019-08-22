const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cron = new Schema({
    userId: String,
    time: Date
})

module.exports = mongoose.model('Cron', cron, 'crons');