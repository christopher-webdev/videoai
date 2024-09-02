const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        enum: ['utilize', 'affiliate'],
    },
    videoLinks: [
        {
            link: { type: String, required: true },

            addedAt: { type: Date, default: Date.now }, // Store the date when the video was added
        },
    ],
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
