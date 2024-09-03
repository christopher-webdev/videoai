// const mongoose = require('mongoose');

// const connectDB = async () => {
//     try {
//         await mongoose.connect(getEnv('DB_URL'), {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//             serverSelectionTimeoutMS: 5000,
//             dbName: getEnv('DB_NAME'),
//         });
//         console.log('MongoDB connected');
//     } catch (err) {
//         console.error(err.message);
//         process.exit(1);
//     }
// };
// module.exports = connectDB;
const mongoose = require('mongoose');
const { bootstrap } = require('../functions/startup');
const getEnv = require('./env');

const connectDB = async () => {
    try {
        // Local MongoDB URI
        await mongoose.connect(getEnv("MONGO_URL"), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
        })
        // .then(require("mongo-wireframe"))
        .then(bootstrap);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};
module.exports = connectDB;
