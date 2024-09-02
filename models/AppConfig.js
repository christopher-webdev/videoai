const mongoose = require('mongoose');

const appConfig = new mongoose.Schema({
    name: { type: String, required: [true, "App config name is required"] },
    value: { type: Object, required: [true, "App config value is required"] },
});



const AppConfig = mongoose.model('AppConfig', appConfig);

module.exports = AppConfig;
