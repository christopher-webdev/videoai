const express = require('express');
const passport = require('passport');
const path = require('path');
const router = express.Router();
const { User, AffiliateSys } = require('../models/User');
const { SubscriptionPlan } = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { check, validationResult } = require('express-validator');
const { PORT } = require('../config');
const Package = require('../models/Package');
const { Package: EPackage } = require('../enums/Package');
const PaymentProvider = require('../models/PaymentProvider');

// Define the function to update credits
const updateUserCredits = async (user, subscriptionPlan) => {
    try {
        // Find the subscription plan to inherit credits from
        const plan = await SubscriptionPlan.findOne({ plan: subscriptionPlan });

        if (!plan) {
            console.error(`Subscription plan ${subscriptionPlan} not found`);
            throw new Error('Subscription plan not found');
        }

        // Update the user's subscription plan and credits
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                subscriptionPlan,
                credits: plan.credits, // Inherit credits from the subscription plan
            },
            { new: true }
        );

        if (!updatedUser) {
            console.error(`User with ID ${user._id} not found`);
            throw new Error('User not found');
        }

        return updatedUser;
    } catch (error) {
        console.error('Error updating subscription plan:', error);
        throw new Error('Internal server error');
    }
};

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cvideoai@gmail.com',
        pass: 'lpyt gmfn emmi ucoz', // Use application-specific password if 2FA is enabled
    },
    logger: true, // Enable logging
    debug: true, // Enable debug output
    tls: {
        rejectUnauthorized: false,
    },
});

// Function to generate a random ID
function generateRandomId() {
    const timestamp = Date.now().toString(); // Convert timestamp to string
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let randomChars = '';
    for (let i = 0; i < 3; i++) {
        randomChars += alphabet.charAt(
            Math.floor(Math.random() * alphabet.length)
        );
    }
    const combinedId = timestamp + randomChars;
    return combinedId.slice(0, 10); // Ensure the ID length is no more than 10 characters
}

router.post(
    '/',
    [
        check('firstName', 'First name is required').not().isEmpty(),
        check('lastName', 'Last name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
            'password',
            'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one symbol.'
        ).matches(
            /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{6,}$/
        ),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            firstName,
            lastName,
            email,
            password,
            subscriptionPlan,
            referral,
        } = req.body;
        const referral_id = generateRandomId(); // Generate a random ID for referral

        try {
            // Check if the user already exists
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                if (existingUser.isVerified) {
                    return res
                        .status(400)
                        .json({ msg: 'User already registered and verified' });
                }

                // Generate a new verification token and send a new verification email
                const verificationToken = crypto
                    .randomBytes(32)
                    .toString('hex');
                const verificationLink = `https://eldravideo.com/auth/verify-email?token=${verificationToken}`;

                existingUser.verificationToken = verificationToken;
                await existingUser.save();

                await transporter.sendMail({
                    to: existingUser.email,
                    from: 'cvideoai@gmail.com',
                    subject: 'Email Verification',
                    html: `<p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>`,
                });

                // Respond with a message and a redirect flag
                return res.status(200).json({
                    msg: 'Verification email sent again',
                    redirect: '/email-verification.html',
                });
            }

            // If user does not exist, proceed with sign-up
            let plan = await Package.findOne({ name: EPackage.Free.name });
            if (!plan) {
                plan = await Package.create({ name: EPackage.Free.name });
            }

            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationLink = `https://eldravideo.com/auth/verify-email?token=${verificationToken}`;

            const credit = await SubscriptionPlan.create({ plan: plan.name });

            const user = await User.create({
                firstName,
                lastName,
                email,
                password,
                isVerified: false,
                verificationToken,
                subscriptionPlan: plan.name || 'Free', // Set default subscription plan
                activePackage: plan.id,
                referral_id, // Include generated referral_id
                referral, // Referral from the request body
            });

            // Save the user to the database
            await user.save();
            await plan.updateOne({ creditStore: credit._id });

            // Apply credits based on the subscription plan
            await updateUserCredits(user, plan.name || 'Free');

            await transporter.sendMail({
                to: user.email,
                from: 'cvideoai@gmail.com',
                subject: 'Email Verification',
                html: `<p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>`,
            });

            // Respond with a message and a redirect flag
            res.status(200).json({
                msg: 'Verification email sent',
                redirect: '/email-verification.html',
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }
);

module.exports = router;
