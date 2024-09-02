const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Location name is required"] },
    image: { type: String, required: [true, "Location Image is required"] },
});

const avatarSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Avatar name is required"] },
    image: { type: String, required: [true, "Image is required"] },
    locations: { type: [locationSchema], required: [true, "Location is required for this avatar"] },
});

const Avatar = mongoose.model('Avatar', avatarSchema);

module.exports = Avatar;
