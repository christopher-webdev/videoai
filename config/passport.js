const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const mongoose = require('mongoose');
const { User } = require('../models/User');
const { SubscriptionPlan } = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const getEnv = require('./env');
const Package = require('../models/Package');
const { Package: EPackage } = require('../enums/Package');
const PaymentProvider = require('../models/PaymentProvider');

// Function to manually parse the full name
function parseFullName(fullName) {
    const nameParts = fullName.split(' ');
    return {
        first: nameParts[0] || '',
        last: nameParts.slice(1).join(' ') || '', // Join the rest as last name
    };
}
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
module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID:
                    '250038052754-atan58f9rgc9q6oacvrq11mfdlneecph.apps.googleusercontent.com',
                clientSecret: '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',
                callbackURL: 'https://eldravideo.com/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                const fullName = profile.displayName || '';
                const parsedName = parseFullName(fullName);
                const plan = await Package.findOne({
                    name: EPackage.Free.name,
                });
                const newUser = {
                    firstName: parsedName.first || '',
                    lastName: parsedName.last || '',
                    email: profile.emails[0].value,
                    profilePicture: profile.photos[0].value,
                    isSignedIn: true,
                    subscriptionPlan: plan.name || 'Free', // Set default subscription plan
                    activePackage: plan.id,
                    referral_id: generateRandomId(), // Generate referral ID
                    // other fields as needed
                };

                try {
                    let user = await User.findOne({ email: newUser.email });

                    if (user) {
                        // User exists, update their `isSignedIn` and other necessary fields
                        user.isSignedIn = true;
                        // You can update other fields if needed
                        await user.save();
                        done(null, user);
                    } else {
                        // Create new user
                        user = await User.create(newUser);

                        // Apply default credits if needed
                        await applyDefaultCredits(user._id, 'Free');

                        done(null, user);
                    }
                } catch (err) {
                    console.error(err);
                    done(err, false);
                }
            }
        )
    );

    passport.use(
        new LocalStrategy(
            { usernameField: 'email' },
            async (email, password, done) => {
                try {
                    const user = await User.findOne({ email });

                    if (!user) {
                        return done(null, false, {
                            message: 'That email is not registered',
                        });
                    }

                    // const match = await bcrypt.compare(
                    //     password,
                    //     user.password
                    // );
                    const match = password === user.password;

                    if (!match) {
                        return done(null, false, {
                            message: 'Password incorrect',
                        });
                    }

                    if (!user.isVerified) {
                        return done(null, false, {
                            message: 'Please verify your email',
                        });
                    }

                    // Update the isSignedIn flag
                    user.isSignedIn = true;
                    await user.save();

                    return done(null, user);
                } catch (err) {
                    console.error(err);
                    return done(err);
                }
            }
        )
    );

    passport.use(
        'admin-local',
        new LocalStrategy(
            { usernameField: 'email' },
            async (email, password, done) => {
                try {
                    const admin = await Admin.findOne({ email });
                    if (!admin) {
                        return done(null, false, {
                            message: 'Invalid credentials',
                        });
                    }

                    const isMatch = await bcrypt.compare(
                        password,
                        admin.password
                    );

                    if (!isMatch) {
                        return done(null, false, {
                            message: 'Invalid credentials',
                        });
                    }

                    return done(null, admin);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    passport.use(
        new TwitterStrategy(
            {
                consumerKey: 'vIv7Oi88efthaCI9VSQtJK5HP',
                consumerSecret:
                    'mtN86XgtyE2nyuni2vNNGnErDiWg51XZIdofSHnRybws3Y0V1Q',
                callbackURL: 'https://eldravideo.com/auth/twitter/callback',
                includeEmail: true,
            },
            async (token, tokenSecret, profile, done) => {
                const fullName = profile.displayName || '';
                const parsedName = parseFullName(fullName);
                const plan = await Package.findOne({
                    name: EPackage.Free.name,
                });
                const newUser = {
                    firstName: parsedName.first || '',
                    lastName: parsedName.last || '',
                    email: profile.emails[0].value,
                    profilePicture: profile.photos[0].value,
                    isSignedIn: true, // Set user as signed in
                    subscriptionPlan: plan.name || 'Free', // Set default subscription plan
                    activePackage: plan.id,
                    referral_id: generateRandomId(), // Generate referral ID
                    // other fields as needed
                };

                try {
                    let user = await User.findOne({ email: newUser.email });

                    if (user) {
                        // User exists, update their `isSignedIn` and other necessary fields
                        user.isSignedIn = true;
                        // You can update other fields if needed
                        await user.save();
                        done(null, user);
                    } else {
                        // Create new user
                        user = await User.create(newUser);

                        // Apply default credits if needed
                        await applyDefaultCredits(user._id, 'Free');

                        done(null, user);
                    }
                } catch (err) {
                    console.error(err);
                    done(err, false);
                }
            }
        )
    );

    passport.serializeUser((entity, done) => {
        done(null, {
            id: entity.id,
            type: entity instanceof Admin ? 'Admin' : 'User',
        });
    });

    passport.deserializeUser(async (obj, done) => {
        try {
            let entity;
            if (obj.type === 'Admin') {
                entity = await Admin.findById(obj.id);
            } else {
                entity = await User.findById(obj.id);
                if (entity.isImpersonated) {
                    entity.isImpersonated = false; // Reset impersonation flag
                    await entity.save();
                }
            }
            done(null, entity);
        } catch (err) {
            done(err, null);
        }
    });
};
// Helper function to apply default credits
async function applyDefaultCredits(userId, subscriptionPlan) {
    try {
        const plan = await SubscriptionPlan.findOne({ plan: subscriptionPlan });

        if (!plan) {
            console.error(`Subscription plan ${subscriptionPlan} not found`);
            return;
        }

        // Update the user's subscription plan and credits
        await User.findByIdAndUpdate(
            userId,
            {
                subscriptionPlan,
                credits: plan.credits, // Inherit credits from the subscription plan
            },
            { new: true }
        );
    } catch (error) {
        console.error('Error updating subscription plan:', error);
    }
}
