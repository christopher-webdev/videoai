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
const { AppConfig } = require('aws-sdk');
const { AppConfigTable } = require('../functions/startup');

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
