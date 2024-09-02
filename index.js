const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');
const { User } = require('./models/User');
const { SubscriptionPlan } = require('./models/User');
const Project = require('./models/Project');
const Avatar = require('./models/Avatar');
const Video = require('./models/VideoModel');
const Newsletter = require('./models/Newsletter');
const { ReferralPayment } = require('./models/User'); // Adjust the path as needed
const { AffiliateSys } = require('./models/User');
const { RequestSystem } = require('./models/User');

const signupRoute = require('./routes/signupRoute');
const bodyParser = require('body-parser');

const resetPasswordRoute = require('./routes/resetPasswordRoute');

const { check, validationResult } = require('express-validator');
const { PORT } = require('./config');
const adminAuthRoutes = require('./routes/admin');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const fs = require('fs');
const os = require('os');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
const userInfoController = require('./controllers/user.controller');
const userBillingController = require('./controllers/user-billing.controller');
const Package = require('./models/Package');
const userPackageController = require('./controllers/package.controller');
const appConfigController = require('./controllers/app-config.controller');
const { createAvatar } = require('./routes/create-avatar');
const getEnv = require('./config/env');
const AWS = require('aws-sdk');
require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

const AppConfig = require('./models/AppConfig');
const { AppConfigTable } = require('./functions/startup');
const { formatMoney } = require('./functions/helpers');
// Passport Config
require('./config/passport')(passport);

connectDB();
const app = express();

// Express session
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set up multer storage
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'local-uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const localUpload = multer({ storage: localStorage });

// Body parser middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration starts//////////////////////////////////////////////////////////////////////
// const uploadDir = path.join(__dirname, 'uploads');
// const downloadDir = path.join(__dirname, 'downloads');

// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// if (!fs.existsSync(downloadDir)) {
//     fs.mkdirSync(downloadDir, { recursive: true });
// }

// // Multer storage configuration for 'uploads' directory
// const uploadStorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/');
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//         cb(
//             null,
//             file.fieldname +
//                 '-' +
//                 uniqueSuffix +
//                 path.extname(file.originalname)
//         );
//     },
// });

// // Multer storage configuration for 'download' directory
// const downloadStorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'downloads/');
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//         cb(
//             null,
//             `${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`
//         );
//     },
// });

// Configure AWS SDK
// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key ID
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
//     //region: process.env.AWS_REGION, // Your AWS Region
// });
// const s3 = new AWS.S3();

// // Multer storage configuration for 'uploads' directory on S3
// const uploadStorage = multerS3({
//     s3: s3,
//     bucket: process.env.S3_BUCKET_NAME, // Your S3 Bucket Name
//     acl: 'public-read',
//     key: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//         cb(
//             null,
//             'uploads/' +
//                 file.fieldname +
//                 '-' +
//                 uniqueSuffix +
//                 path.extname(file.originalname)
//         );
//     },
// });

// // Multer storage configuration for 'downloads' directory on S3
// const downloadStorage = multerS3({
//     s3: s3,
//     bucket: process.env.S3_BUCKET_NAME, // Your S3 Bucket Name
//     acl: 'public-read',
//     key: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//         cb(
//             null,
//             'downloads/' +
//                 req.params.id +
//                 '-' +
//                 uniqueSuffix +
//                 path.extname(file.originalname)
//         );
//     },
// });

// // Create Multer instances for each storage configuration
// const upload = multer({ storage: uploadStorage });
// const downloadUpload = multer({ storage: downloadStorage });

// Configure AWS SDK
// Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION, // Ensure this is set
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Multer storage configuration for 'uploads' directory on S3
const uploadStorage = multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(
            null,
            'uploads/' +
                file.fieldname +
                '-' +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

// Multer storage configuration for 'downloads' directory on S3
const downloadStorage = multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(
            null,
            'downloads/' +
                req.params.id +
                '-' +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

// Create Multer instances
const upload = multer({ storage: uploadStorage });
const downloadUpload = multer({ storage: downloadStorage });

/////////////////////end of multer settings///////////////////////////////////////////////////////
// middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login.html'); // Redirect to login page if not authenticated or signed in
}
const verifyTokenMiddleware = async (req, res, next) => {
    const { token } = req.query;
    if (!token) {
        return res.status(403).json({ msg: 'No token provided' });
    }

    try {
        const user = await User.findOne({
            oneTimeToken: token,
            oneTimeTokenExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(403).json({ msg: 'Invalid or expired token' });
        }

        // Attach user to request object if needed
        req.user = user;
        // Clear the one-time token for security reasons
        user.oneTimeToken = undefined;
        user.oneTimeTokenExpires = undefined;
        await user.save();

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

const updateCreditsMiddleware = async (req, res, next) => {
    const { userId } = req.params;
    const { subscriptionPlan } = req.body;

    console.log(`Updating user ${userId} to plan ${subscriptionPlan}`);

    try {
        // Find the subscription plan to inherit credits from
        const plan = await SubscriptionPlan.findOne({ plan: subscriptionPlan });

        if (!plan) {
            console.error(`Subscription plan ${subscriptionPlan} not found`);
            return res
                .status(404)
                .json({ message: 'Subscription plan not found' });
        }

        // Update the user's subscription plan and credits
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                subscriptionPlan,
                credits: plan.credits, // Inherit credits from the subscription plan
            },
            { new: true }
        );

        if (!updatedUser) {
            console.error(`User with ID ${userId} not found`);
            return res.status(404).json({ message: 'User not found' });
        }

        req.updatedUser = updatedUser;
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Error updating subscription plan:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
function ensureAdminAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin-login.html');
}

// API Routes
app.use('/api/signup', signupRoute);
app.use('/api/forgot-password', resetPasswordRoute);
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

//handles user info updates
app.use('/api/user-info', ensureAuthenticated, userInfoController);
app.use('/api/billings', userBillingController);
app.use('/api/packages', ensureAuthenticated, userPackageController);
app.use('/api/config', appConfigController);

// Serve index.html for the root URL

// // Catch 404 errors
// app.use((req, res, next) => {
//     res.status(404);
//     res.sendFile(path.join(__dirname, 'public', '404.html'));
// });

// Catch 500 errors and other server errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500);
    res.sendFile(path.join(__dirname, 'public', '404.html'));
});

// Handle 502, 503, 504 errors
app.use((err, req, res, next) => {
    if (
        res.statusCode === 500 ||
        res.statusCode === 502 ||
        res.statusCode === 503 ||
        res.statusCode === 504
    ) {
        res.sendFile(path.join(__dirname, 'public', '500.html'));
    } else {
        next(err);
    }
});

// Route for uploading files
app.post('/upload', upload.single('file'), (req, res) => {
    res.send('File uploaded successfully!');
});

// Route for downloading files
app.post('/download/:id', downloadUpload.single('file'), (req, res) => {
    res.send('File uploaded successfully!');
});
// Route for downloading files
app.get('/download/:id', downloadUpload.single('file'), (req, res) => {
    res.send('File downloded successfully!');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Displays billing methods
app.get('/signup', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});
app.get('/payment-methods', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'payment-methods.html'));
});
app.get('/affiliate-program.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'affiliate-program.html'));
});
app.get('/affiliate-program', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'affiliate-program.html'));
});
app.get('/payment-methods.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'payment-methods.html'));
});
// Displays billing methods
app.get('/manage-subscription', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'manage-subscription.html'));
});
app.get('/manage-subscription.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'manage-subscription.html'));
});
// Protect specific routes
app.get('/plans-billing', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'plans-billing.html'));
});
app.get('/plans-billing.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'plans-billing.html'));
});
app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/dashboard.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/video-editor', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'video-editor.html'));
});
app.get('/video-editor.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'video-editor.html'));
});
app.get('/face-swap', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'face-swap.html'));
});
app.get('/face-swap.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'face-swap.html'));
});

app.get('/video-restyle', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'video-restyle.html'));
});
app.get('/video-restyle.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'video-restyle.html'));
});
app.get('/3d-video', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', '3d-video.html'));
});
app.get('/3d-video.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', '3d-video.html'));
});
app.get('/lip-sync', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'lip-sync.html'));
});
app.get('/lip-sync.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'lip-sync.html'));
});
app.get('/video-voicing', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'video-voicing.html'));
});
app.get('/video-voicing.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'video-voicing.html'));
});
app.get('/my-avatar', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'my-avatar.html'));
});
app.get('/my-avatar.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'my-avatar.html'));
});
app.get('/my-account', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'my-account.html'));
});
app.get('/my-account.html', ensureAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'my-account.html'));
});
app.get('/login', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/admin-dashboard.html', ensureAdminAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});
app.get('/admin-dashboard', ensureAdminAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});
app.get('/manageavatar.html', ensureAdminAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'manageavatar.html'));
});
app.get('/manageplanx.html', ensureAdminAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'manageplanx.html'));
});
//ensure Auth for manage-plan.html
app.get('/manage-plan', ensureAdminAuthenticated, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'manage-plan.html'));
});
//email verification middleware
// Middleware to check if the user is new (i.e., created within the last 10 minutes)

app.get('/email-verified', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'email-verified.html'));
});
app.get('/email-verification.html', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'email-verification.html'));
});
//rest password token rest link
app.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({
                msg: 'Password reset token is invalid or has expired.',
            });
        }
        // Serve the reset-password.html file
        res.sendFile(path.join(__dirname, './public/reset-password.html')); // Adjust the path as needed
    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: 'There was an error processing your request. Please try again later.',
        });
    }
});
// Route to handle password reset form submission
app.post('/auth/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                msg: 'Password reset token is invalid or has expired.',
            });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ msg: 'Password has been successfully reset.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: 'There was an error resetting your password. Please try again later.',
        });
    }
});

app.post(
    '/submit-video',
    ensureAuthenticated,
    upload.fields([
        { name: 'videoFiles', maxCount: 5 },
        { name: 'pictureFiles', maxCount: 5 },
        { name: 'audioFiles', maxCount: 5 },
    ]),
    async (req, res) => {
        try {
            const userId = req.user._id;
            const {
                videoLinks, // Changed to handle multiple links
                videoDescription,
                selectedAvatar, // Added to receive the selected avatar name
                selectedLocation, // Added to receive the avatar location
            } = req.body;

            const title = req.headers['page-title'] || 'Untitled Project';

            // Determine the feature based on the project title
            const featureMap = {
                'Video Editor AI': 'videoEditor',
                'Video Restyling AI': 'videoRestyle',
                'Video Voicing': 'videoVoicing',
                'Lip Sync AI': 'lipSync',
                'Face Swap AI': 'faceSwap',
                '3D Video Modeling AI': '3dVideoModeling',
                'Add Avatar': 'myAvatar',
            };
            const feature = featureMap[title];

            // Check if the user has enough credits for the feature
            const user = await User.findById(userId);
            const userCredit = user.credits.find(
                (credit) => credit.feature === feature
            );
            if (!userCredit || userCredit.credits <= 0) {
                return res.status(403).json({
                    error: `You have exceeded the submit limit for ${title}. Please upgrade your subscription to submit more.`,
                });
            }

            // Deduct a credit
            userCredit.credits -= 1;
            await user.save();

            // Get the file URLs from S3
            const videoFiles = req.files['videoFiles']
                ? req.files['videoFiles'].map((file) => file.location) // S3 URL
                : [];
            const pictureFiles = req.files['pictureFiles']
                ? req.files['pictureFiles'].map((file) => file.location) // S3 URL
                : [];
            const audioFiles = req.files['audioFiles']
                ? req.files['audioFiles'].map((file) => file.location) // S3 URL
                : [];

            const newProject = new Project({
                userId,
                title,
                videoFiles,
                videoLink: JSON.parse(videoLinks), // Parse JSON string to array
                pictureFiles,
                audioFiles,
                videoDescription,
                avatar: selectedAvatar, // Save the selected avatar name
                location: selectedLocation, // Save the avatar location
                status: 'Pending',
            });

            await newProject.save();
            res.status(201).json({
                message: 'Project created successfully',
                projectId: newProject._id,
                remainingCredits: userCredit.credits, // Include remaining credits in the response
            });
        } catch (error) {
            res.status(500).json({
                error: 'Error creating project: ' + error.message,
            });
        }
    }
);

// Set FFmpeg and FFprobe paths for Thumbnail settings
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Function to generate a thumbnail from a video file
async function generateThumbnail(videoFile) {
    return new Promise((resolve, reject) => {
        const tempThumbnailPath = path.join(
            os.tmpdir(),
            `${path.basename(videoFile, path.extname(videoFile))}.png`
        );
        ffmpeg(videoFile)
            .on('end', () => {
                resolve(tempThumbnailPath);
            })
            .on('error', (err) => {
                reject(err);
            })
            .screenshots({
                timestamps: ['50%'],
                filename: path.basename(tempThumbnailPath),
                folder: path.dirname(tempThumbnailPath),
                size: '320x240',
            });
    });
}

// Handle PayPal form submissionconst crypto = require('crypto'); // Make sure to require crypto
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////HANDLING USER SIDE AFFILIATE PROGRAM/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Route for handling PayPal form submission

// Route for handling PayPal form submission
app.post('/api/paypal-pay', ensureAuthenticated, async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { paypaladdress } = req.body;
    console.log('Received PayPal address:', paypaladdress);

    try {
        // Use findOneAndUpdate to either update an existing document or create a new one if it doesn't exist
        const referral = await ReferralPayment.findOneAndUpdate(
            { email: req.user.email }, // Search for document by email
            {
                $set: {
                    // Update the PayPal information
                    Paypal: paypaladdress,
                },
                $setOnInsert: {
                    // Set unique ID and email if inserting new document
                    id: crypto.randomUUID().toString('hex'),
                    email: req.user.email,
                },
            },
            {
                new: true, // Return the updated document
                upsert: true, // Create the document if it doesn't exist
            }
        );

        res.status(200).json({
            msg: 'PayPal information updated successfully!',
            email: req.user.email,
        });
    } catch (err) {
        console.error('Error updating PayPal information:', err.message);
        res.status(500).json({ msg: 'Server error', email: req.user.email });
    }
});
// Handle Credit Card form submission
// Route for handling Credit Card form submission
app.post('/api/credit-card', ensureAuthenticated, async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { cardNumber, cardName, cardExp } = req.body;

    try {
        // Use findOneAndUpdate to either update an existing document or create a new one if it doesn't exist
        const referral = await ReferralPayment.findOneAndUpdate(
            { email: req.user.email }, // Search for document by email
            {
                $set: {
                    // Update the card information
                    CardNumber: cardNumber,
                    CardName: cardName,
                    Expiringdate: cardExp,
                },
                $setOnInsert: {
                    // Set unique ID and email if inserting new document
                    id: crypto.randomUUID().toString('hex'),
                    email: req.user.email,
                },
            },
            {
                new: true, // Return the updated document
                upsert: true, // Create the document if it doesn't exist
            }
        );
        res.status(200).json({
            msg: 'Credit card information updated successfully!',
        });
    } catch (err) {
        console.error('Error updating credit card information:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Handles user affiliate payments
app.get('/api/user-payment', ensureAuthenticated, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Ensure you are finding by email and not by ID
        const payment = await ReferralPayment.findOne({ email: userEmail });

        if (!payment) {
            return res
                .status(404)
                .json({ error: 'Payment information not found.' });
        }

        res.json(payment);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            error: 'Error fetching payment information: ' + error.message,
        });
    }
});
//get user referrals
app.get('/api/referrals', ensureAuthenticated, async (req, res) => {
    try {
        // Find users where `referral_id` matches the logged-in user's `referral_id`
        const user = await User.findById(req.user._id, 'referral_id');
        const referrals = await User.find(
            { referral: req.user.referral_id },
            'firstName lastName'
        );
        const earnedPerUserRefererd = await AppConfig.findOne(
            { name: AppConfigTable.earningPerUserReferered },
            'value'
        );
        const response = {
            referral_id: user.referral_id,
            referrals: referrals.map((ref) => ({
                amountEarned: `+${formatMoney(earnedPerUserRefererd.value)}`,
                firstName: ref.firstName,
                lastName: ref.lastName,
            })),
            totalEarned: formatMoney(
                referrals.length * earnedPerUserRefererd.value
            ),
        };
        // Send the referral data
        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching referrals:', error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});
//get referral link for each user
app.get('/api/referral-info', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({
            referral_id: user.referral_id,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error fetching referral information: ' + error.message,
        });
    }
});
///request for refferral earning withdrwal

// Route to handle withdrawal request
app.post('/api/request-withdrawal', ensureAuthenticated, async (req, res) => {
    try {
        // Fetch affiliate system data to get limit
        const affiliateData = await AffiliateSys.findOne();

        if (!affiliateData) {
            return res
                .status(400)
                .json({ success: false, message: 'Affiliate data not found' });
        }

        const limit = parseInt(affiliateData.limit, 10);

        // Fetch referrals for the logged-in user
        const referrals = await User.find({ referral: req.user.referral_id });

        const totalReferred = referrals.length;

        // Check if user's total referred is greater than or equal to limit
        if (totalReferred >= limit) {
            // Check if there is an existing pending or successful request
            const existingRequest = await RequestSystem.findOne({
                email: req.user.email,
                WithdrawalRequestStatus: { $in: ['Pending', 'Successful'] },
            });

            if (existingRequest) {
                // User already has a pending or successful request
                return res.status(400).json({
                    success: false,
                    message:
                        'You already have a pending or successful request.',
                });
            }

            // Create new withdrawal request
            const newRequest = new RequestSystem({
                name: req.user.firstname + ' ' + req.user.lastname,
                email: req.user.email,
                total_referred: totalReferred.toString(),
                requestdate: new Date().toISOString(),
                WithdrawalRequestStatus: 'Pending',
            });

            await newRequest.save();

            return res.status(200).json({
                success: true,
                message: 'Withdrawal request submitted successfully!',
                request: {
                    email: req.user.email,
                    total_referred: totalReferred,
                    requestdate: newRequest.requestdate,
                    status: newRequest.WithdrawalRequestStatus,
                },
            });
        } else {
            // Not enough referrals to withdraw
            return res.status(400).json({
                success: false,
                message: 'Not enough referrals to request withdrawal.',
            });
        }
    } catch (error) {
        console.error(
            'Error processing withdrawal request for user:',
            req.user.email,
            'Error:',
            error.message
        );
        return res
            .status(500)
            .json({ success: false, message: 'Server error' });
    }
});

// API to update Output History for user on video edit status
app.get('/api/video-status', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id; // Get the logged-in user's ID from the authenticated session
        const projects = await Project.find({ userId }).sort({ createdAt: -1 });

        const projectStatuses = await Promise.all(
            projects.map(async (project) => {
                let thumbnailUrl = null;
                if (project.videoFiles.length > 0) {
                    try {
                        const thumbnailPath = await generateThumbnail(
                            project.videoFiles[0]
                        );
                        const thumbnailData = fs.readFileSync(
                            thumbnailPath,
                            'base64'
                        );
                        thumbnailUrl = `data:image/png;base64,${thumbnailData}`;
                        fs.unlinkSync(thumbnailPath);
                    } catch (error) {
                        console.error(
                            `Error generating thumbnail for project ${project._id}:`,
                            error
                        );
                    }
                }

                return {
                    id: project._id,
                    title: project.title,
                    status: project.status,
                    comment:
                        project.statusHistory.length > 0
                            ? project.statusHistory[
                                  project.statusHistory.length - 1
                              ].comment
                            : '', // Get the latest comment
                    estimatedCompletionTime: project.estimatedCompletionTime,
                    createdAt: project.createdAt,
                    downloadLink: project.downloadLink,
                    thumbnail: thumbnailUrl,
                };
            })
        );

        res.json(projectStatuses);
    } catch (error) {
        res.status(500).json({
            error: 'Error fetching video status: ' + error.message,
        });
    }
});

//admin api for dashboard
//gets all project
app.get('/api/projects', ensureAdminAuthenticated, async (req, res) => {
    try {
        const projects = await Project.find().populate('userId');
        res.json({ projects });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
//project reuploads after downloading and editing offline
// app.post(
//     '/api/projects/:id/reupload',
//     downloadUpload.single('file'),
//     async (req, res) => {
//         try {
//             const project = await Project.findById(req.params.id);
//             if (!project) {
//                 return res.status(404).json({ error: 'Project not found' });
//             }
//             // Save the file path relative to the 'download' directory in the editedFile field
//             project.editedFile = req.file.filename;
//             project.downloadLink = `/downloads/${req.file.filename}`;
//             await project.save();
//             res.json({ project });
//         } catch (error) {
//             console.error('Failed to reupload file:', error);
//             res.status(500).json({ error: 'Failed to reupload file' });
//         }
//     }
// );
app.post(
    '/api/projects/:id/reupload',
    downloadUpload.single('file'),
    async (req, res) => {
        try {
            const project = await Project.findById(req.params.id);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            // Save the full S3 URL in the `downloadLink` field
            const s3Url = req.file.location;
            project.editedFile = req.file.key; // S3 key
            project.downloadLink = s3Url; // Full S3 URL

            await project.save();
            res.json({ project });
        } catch (error) {
            console.error('Failed to reupload file:', error);
            res.status(500).json({ error: 'Failed to reupload file' });
        }
    }
);
// Helper function to delete a file
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Failed to delete file: ${filePath}`, err);
        } else {
            console.log(`File deleted: ${filePath}`);
        }
    });
};
//deletes project by admin
app.delete('/api/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;

        // Find the project by ID
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete associated files (videoFiles, audioFiles, pictureFiles) from uploads/
        const filesToDeleteFromUploads = [
            ...project.videoFiles,
            ...project.audioFiles,
            ...project.pictureFiles,
            project.editedFile, // Add edited file if it exists
        ];

        filesToDeleteFromUploads.forEach((file) => {
            if (file) {
                const filePath = path.join(__dirname, '../uploads', file);
                deleteFile(filePath);
            }
        });

        // Delete associated files (thumbnails, download links) from downloads/
        const filesToDeleteFromDownloads = [
            ...project.thumbnail,
            project.downloadLink, // Assuming downloadLink points to a file path in downloads/
        ];

        filesToDeleteFromDownloads.forEach((file) => {
            if (file) {
                const filePath = path.join(__dirname, '../downloads', file);
                deleteFile(filePath);
            }
        });

        // Delete the project from the database
        await Project.findByIdAndDelete(projectId);

        res.json({
            message: 'Project and associated files deleted successfully',
        });
    } catch (error) {
        console.error('Failed to delete project:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// app.delete('/api/projects/:id', ensureAdminAuthenticated, async (req, res) => {
//     try {
//         await Project.findByIdAndDelete(req.params.id);
//         res.json({ message: 'Project deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to delete project' });
//     }
// });
//updating project sttus
app.post(
    '/api/admin/update-project-status/:projectId',
    ensureAdminAuthenticated,
    async (req, res) => {
        const { projectId } = req.params;
        const { status, comment, estimatedCompletionTime } = req.body;

        try {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Update status and history
            project.status = status;
            project.statusHistory.push({
                status,
                comment,
                updatedAt: new Date(),
            });

            // Save estimated completion time
            project.estimatedCompletionTime = estimatedCompletionTime;

            await project.save();

            res.status(200).json({ message: 'Status updated successfully' });
        } catch (error) {
            console.error('Error updating status:', error);
            res.status(500).json({ message: 'Failed to update status' });
        }
    }
);
//get media routes
app.get(
    '/api/admin/get-project-media/:projectId',
    ensureAdminAuthenticated,
    async (req, res) => {
        const { projectId } = req.params;

        try {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            res.status(200).json({
                videoFiles: project.videoFiles,
                pictureFiles: project.pictureFiles,
                audioFiles: project.audioFiles,
            });
        } catch (error) {
            console.error('Error fetching project media:', error);
            res.status(500).json({ message: 'Failed to fetch project media' });
        }
    }
);

//get all users
app.get('/api/users', ensureAdminAuthenticated, async (req, res) => {
    try {
        const users = await User.find();
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
// gets all user by id
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete user
app.delete('/users/:id', ensureAdminAuthenticated, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
/////////////////////////////////////////////////////////////////////////////////deletes output history for user
app.delete('/api/project/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await Project.findByIdAndDelete(id);
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({
            error: 'Error deleting project: ' + error.message,
        });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////// AI VISABILITY
let isdashboardVisibility = {
    videoEditor: true,
    videoRestyle: true,
    videoVoicing: true,
    lipSync: true,
    faceSwap: true,
    threeDVideoModeling: true,
    myAvatar: true,
}; // In-memory storage for simplicity
// Endpoint to set visibility
app.post('/api/toggle-dashboard-visibility', (req, res) => {
    const { cardId, isVisible } = req.body;

    if (!cardId || typeof isVisible !== 'boolean') {
        return res.status(400).send({ error: 'Invalid request data' });
    }

    // Update the visibility state
    isdashboardVisibility[cardId] = isVisible;

    console.log(`Updated visibility for ${cardId}: ${isVisible}`);

    // Respond with success
    res.status(200).send({ message: `Visibility updated for ${cardId}` });
});

// Endpoint to get visibility
app.get('/api/get-dashboard-visibility', (req, res) => {
    res.status(200).json({ isVisible: isdashboardVisibility });
});

///////////////////////////////////////////////////////////////////////////////////////////////////END OF AI VISABILITY
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////// set credit ADMIN daashboard
app.post('/set-credits', ensureAdminAuthenticated, async (req, res) => {
    const { subscriptionPlan, credits } = req.body;

    console.log('Received subscriptionPlan:', subscriptionPlan); // Debug log
    console.log('Received credits:', credits); // Debug log

    try {
        if (!subscriptionPlan || !Array.isArray(credits)) {
            return res.status(400).json({ message: 'Invalid request data' });
        }

        let plan = await SubscriptionPlan.findOne({ plan: subscriptionPlan });
        if (!plan) {
            plan = new SubscriptionPlan({ plan: subscriptionPlan });
        }

        plan.credits = credits;
        await plan.save();

        res.status(200).json({ message: 'Credits successfully set' });
    } catch (error) {
        console.error('Error setting credits:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/get-credits', ensureAdminAuthenticated, async (req, res) => {
    try {
        // Retrieve all subscription plans
        const subscriptionPlans = await SubscriptionPlan.find({});

        // Structure the data for response
        const creditsData = subscriptionPlans.map((plan) => ({
            plan: plan.plan,
            credits: plan.credits.map((credit) => ({
                feature: credit.feature,
                credits: credit.credits,
            })),
        }));

        res.status(200).json({ creditsData });
    } catch (error) {
        console.error('Error retrieving credits:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////UPDATE SUBSCRIPTION PLAN
app.put('/update-subscription/:userId', updateCreditsMiddleware, (req, res) => {
    // Here, the user has already been updated by the middleware
    res.status(200).json({
        message: 'Subscription plan updated successfully',
        user: req.updatedUser,
    });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Setup Multer for local storage for avatar locally

// POST /api/avatars
// POST /api/avatars
app.post('/api/avatars', localUpload.any(), async (req, res) => {
    try {
        const [avatarImage, ...locations] = req.files;
        const { avatarName, location: locationNames } = req.body;

        const payload = {
            name: avatarName,
            image: avatarImage?.path,
            locations: [],
        };

        for (let i = 0; i < locations.length; i++) {
            const path = locations?.[i]?.path;
            const name = locationNames?.[i];
            if (!(path && name)) {
                throw new Error(
                    'Please check file and name are correctly uploaded'
                );
            }
            payload.locations.push({ name, image: path });
        }
        const updatedAvatar = await Avatar.create(payload);

        res.status(201).json({ success: true, data: updatedAvatar });
    } catch (error) {
        res.status(500).json({ success: false, errors: error.message });
    }
});

// PUT /api/avatars
// PUT /api/avatars
app.put('/api/avatars/:id', localUpload.any(), async (req, res) => {
    try {
        const { id } = req.params;
        const [avatarImage, ...locations] = req.files;
        const { avatarName, location: locationNames } = req.body;

        const payload = {
            name: avatarName,
            image: avatarImage.path,
            locations: [],
        };

        for (let i = 0; i < locations.length; i++) {
            const path = locations[i].path;
            const name = locationNames[i];
            payload.locations.push({ name, image: path });
        }
        const avatar = await Avatar.findById(id);

        avatar.name = payload.name?.trim() || avatar.name;
        avatar.image = payload.image || avatar.image;
        avatar.locations = [...avatar.locations, ...payload.locations];

        await avatar.save();

        // const updatedAvatar = await Avatar.findByIdAndUpdate(id, payload);

        res.status(200).json({
            success: true,
            data: 'Avatar Updated Successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, errors: error.message });
    }
});
// GET /avatars/:id
app.get('/avatars/:id', async (req, res) => {
    try {
        const avatar = await Avatar.findById(req.params.id);
        if (!avatar) {
            return res.status(404).json({ error: 'Avatar not found' });
        }
        res.status(200).json(avatar);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch avatar' });
    }
});

// GET /api/avatars
app.get('/api/avatars', async (req, res) => {
    try {
        const avatars = await Avatar.find();
        res.status(200).json(avatars);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch avatars' });
    }
});

app.post('/admin/videos/add', ensureAdminAuthenticated, async (req, res) => {
    const { page, videoLink } = req.body;

    try {
        const video = await Video.findOne({ page });
        if (video) {
            video.videoLinks.push({ link: videoLink });
            await video.save();
        } else {
            await Video.create({
                page,
                videoLinks: [{ link: videoLink }],
            });
        }

        res.redirect('/admin-dashboard.html'); // Redirect back to the admin dashboard
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while adding the video.');
    }
});

app.post('/admin/videos/remove', async (req, res) => {
    const { page, videoLink } = req.body;

    try {
        const video = await Video.findOne({ page });

        if (video) {
            // Remove the specific video link
            video.videoLinks = video.videoLinks.filter(
                (link) => link.link !== videoLink
            );
            await video.save();

            res.status(200).send('Video removed');
        } else {
            res.status(404).send('Video not found');
        }
    } catch (error) {
        console.error('Failed to remove video:', error);
        res.status(500).send('Server error');
    }
});

app.get('/utilize', async (req, res) => {
    try {
        const videos = await Video.findOne({ page: 'utilize' });
        res.render('utilize.html', {
            videos: videos ? videos.videoLinks.slice(0, 10) : [],
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while retrieving videos.');
    }
});

app.get('/affiliate', async (req, res) => {
    try {
        const videos = await Video.findOne({ page: 'affiliate' });
        res.render('affiliate.html', {
            videos: videos ? videos.videoLinks.slice(0, 10) : [],
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while retrieving videos.');
    }
});
// Route to fetch video links for a specific page
app.get('/videos/:page', async (req, res) => {
    const { page } = req.params;

    try {
        const videoData = await Video.findOne({ page });
        const videos = videoData ? videoData.videoLinks : [];
        res.json(videos);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'An error occurred while fetching videos.',
        });
    }
});

app.get('/admin/videos', async (req, res) => {
    try {
        const videos = await Video.find();
        res.json(videos);
    } catch (error) {
        console.error('Failed to fetch videos:', error);
        res.status(500).send('Server error');
    }
});
// Route to handle form submission for NEWSLETTER
app.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        const newSubscriber = new Newsletter({ email });
        await newSubscriber.save();
        res.status(200).send('Subscription successful!');
    } catch (error) {
        res.status(400).send('Subscription failed: ' + error.message);
    }
});

// Route to display the list of subscribed emails in JSON format
app.get(
    '/admin/newsletter-subscribers',
    ensureAdminAuthenticated,
    async (req, res) => {
        try {
            const subscribers = await Newsletter.find().sort({
                subscribedAt: -1,
            });
            res.json(subscribers); // Send the subscribers as JSON
        } catch (error) {
            res.status(500).send(
                'Error fetching subscribers: ' + error.message
            );
        }
    }
);
app.delete('/api/avatars/:id', async (req, res) => {
    try {
        const avatar = await Avatar.findById(req.params.id);

        if (!avatar) {
            return res.status(404).json({ error: 'Avatar not found' });
        }

        // Define the path to the avatar image file
        const avatarImagePath = path.join(__dirname, 'uploads', avatar.image);

        // Check if the file exists and delete it
        if (fs.existsSync(avatarImagePath)) {
            fs.unlinkSync(avatarImagePath);
        }

        // Loop through and delete each location image
        avatar.locations.forEach((location) => {
            const locationImagePath = path.join(
                __dirname,
                'uploads',
                location.image
            );
            if (fs.existsSync(locationImagePath)) {
                fs.unlinkSync(locationImagePath);
            }
        });

        // Remove the avatar from the database
        await Avatar.findByIdAndDelete(req.params.id);

        res.json({ message: 'Avatar successfully deleted' });
    } catch (error) {
        console.error('Error deleting avatar:', error);
        res.status(500).json({ error: 'Failed to delete avatar' });
    }
});
// Route to delete a package
app.delete('/packages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Package.findByIdAndDelete(id);
        if (result) {
            res.json({ success: true });
        } else {
            res.status(404).json({
                success: false,
                errors: 'Package not found.',
            });
        }
    } catch (error) {
        console.error('Error deleting package:', error);
        res.status(500).json({
            success: false,
            errors: 'Error deleting package.',
        });
    }
});

app.post('/impersonate/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        req.session.impersonation = {
            isAdmin: true,
            adminId: req.user.id, // store the current admin ID
        };

        req.login(user, (err) => {
            if (err) {
                return res.status(500).send('Error logging in as user');
            }
            res.redirect('/dashboard.html'); // Redirect to the user's dashboard
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use('/local-uploads', express.static('local-uploads'));

// Catch-all route for 404 errors
app.use((req, res, next) => {
    res.status(404);
    res.sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((req, res, next) => {
    res.status(500);
    res.sendFile(path.join(__dirname, 'public', '500.html'));
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
