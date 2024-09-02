const express = require('express');
const passport = require('passport');
const fs = require('fs');
const fss = require('fs').promises;
const path = require('path');
const router = express.Router();
const { User } = require('../models/User');
const { RequestSystem } = require('../models/User');
const { ReferralPayment } = require('../models/User');
const { AffiliateSys } = require('../models/User');
const crypto = require('crypto');
const { check, validationResult } = require('express-validator');
const verifyTokenMiddleware = require('../middleware/auth');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const mkdirp = require('mkdirp');
const { v4: uuidv4 } = require('uuid');
router.use(express.json());
router.use(express.static(path.join(__dirname, 'public')));
router.use(express.urlencoded({ extended: true }));

// main
// Define the route to handle form submission
router.post('/update-request-status/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;

        const result = await RequestSystem.findByIdAndUpdate(
            requestId,
            { WithdrawalRequestStatus: status },
            { new: true }
        );

        if (!result) {
            return res
                .status(404)
                .json({ success: false, message: 'Request not found' });
        }

        res.json({
            success: true,
            message: 'Request status updated successfully',
        });
    } catch (error) {
        console.error('Error updating request status:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/payment-details/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;

        // Find the request by ID to get the email
        const request = await RequestSystem.findById(requestId);

        if (!request) {
            return res
                .status(404)
                .json({ success: false, message: 'Request not found' });
        }

        const email = request.email;

        // Find payment details using the email
        const paymentDetails = await ReferralPayment.findOne({ email: email });

        if (!paymentDetails) {
            return res
                .status(404)
                .json({ success: false, message: 'Payment details not found' });
        }

        res.json({ success: true, paymentDetails: paymentDetails });
    } catch (error) {
        console.error('Error fetching payment details:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/update-affiliate', async (req, res) => {
    try {
        const { id, limit, price } = req.body;

        // Find the document and update it, or insert it if it doesn't exist
        const result = await AffiliateSys.findOneAndUpdate(
            { id: id }, // Filter by ID
            { limit: limit, price: price }, // Update fields
            { new: true, upsert: true } // Options: return the updated document, create if not exists
        );

        // Result will always be the updated or inserted document
        res.send('Affiliate System updated / inserted successfully!');
    } catch (error) {
        console.error(
            'Error updating or inserting affiliate system:',
            error.message
        );
        res.status(500).send('Server error');
    }
});

//get user referrals
router.get('/referrals', async (req, res) => {
    try {
        // Find users where `referral_id` matches the logged-in user's `referral_id`
        const request = await RequestSystem.find();

        // Send the referral data
        res.status(200).json(request);
    } catch (error) {
        console.error('Error fetching request:', error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Express route to update the subscription data
const subscriptionsPath = path.join(
    __dirname,
    '..',
    'public',
    'data',
    'subscription.json'
);
router.post('/update-com', (req, res) => {
    const updatesubscription = req.body; // Assuming this contains the new data
    // Read the subscription.json file
    fs.readFile(subscriptionsPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading subscription file');
        }

        let subscription;
        try {
            subscription = JSON.parse(data); // Parse the JSON data
        } catch (parseErr) {
            return res.status(500).send('Error parsing subscription data');
        }

        // Extract the key and new data from updatesubscription
        const updatePlanKey = Object.keys(updatesubscription[0].plan)[0];
        const newData = updatesubscription[0].plan[updatePlanKey].data;
        // console.log('Before update:', subscription);
        // Iterate through the subscription array to find and update the specific plan's data
        subscription.forEach((planArray) => {
            planArray.forEach((planObj) => {
                const planKey = Object.keys(planObj.plan)[0];
                planObj.plan[planKey].data = newData;
            });
        });
        // console.log('After update:', subscription);
        // Write the updated subscription data back to subscription.json
        fs.writeFile(
            subscriptionsPath,
            JSON.stringify(subscription, null, 2),
            'utf8',
            (writeErr) => {
                if (writeErr) {
                    return res
                        .status(500)
                        .send('Error writing updated subscription file');
                }
                // res.send(message:'Subscription updated successfully');
                res.json({
                    message: 'Subscription updated successfully',
                    newData: newData,
                    updatePlanKey: updatePlanKey,
                    subscription: subscription,
                });
            }
        );
    });
});

//delete comparison

router.delete('/delete-comparison-plan/:planName', (req, res) => {
    const planName = req.params.planName;
    const subscriptionsPath = path.join(
        __dirname,
        '..',
        'public',
        'data',
        'subscription.json'
    );

    // Step 1: Read the subscriptions from the file
    fs.readFile(subscriptionsPath, 'utf8', (err, data) => {
        if (err)
            return res
                .status(500)
                .json({ message: 'Error reading subscriptions file' });

        let subscriptions;
        try {
            subscriptions = JSON.parse(data);
        } catch (err) {
            return res
                .status(500)
                .json({ message: 'Error parsing subscriptions file' });
        }

        // Step 2: Find and remove the plan with the matching name
        let planFound = false;
        const updatedSubscriptions = subscriptions
            .map((subscriptionArray) =>
                subscriptionArray.filter((subscriptionObj) => {
                    const planKeys = Object.keys(subscriptionObj.plan || {});
                    if (
                        planKeys.some(
                            (key) => subscriptionObj.plan[key].name === planName
                        )
                    ) {
                        planFound = true;
                        return false; // Filter out the plan that matches
                    }
                    return true; // Keep the other plans
                })
            )
            .filter((subscriptionArray) => subscriptionArray.length > 0); // Remove any empty arrays

        if (!planFound) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Step 3: Write the remaining subscriptions back to the file
        fs.writeFile(
            subscriptionsPath,
            JSON.stringify(updatedSubscriptions, null, 2),
            'utf8',
            (err) => {
                if (err)
                    return res
                        .status(500)
                        .json({ message: 'Error writing subscriptions file' });
                res.json({ message: 'Comparison plan deleted successfully' });
            }
        );
    });
});
// Handle form submission
router.post('/submit-plans', (req, res) => {
    const subscriptionsPath = path.join(
        __dirname,
        '..',
        'public',
        'data',
        'subscription.json'
    );
    const newSubscriptionData = req.body;

    // Read existing data
    fs.readFile(subscriptionsPath, 'utf8', (err, data) => {
        if (err)
            return res
                .status(500)
                .json({ message: 'Error reading subscription file' });

        let subscriptions;
        try {
            subscriptions = JSON.parse(data);
        } catch (err) {
            return res
                .status(500)
                .json({ message: 'Error parsing subscription file' });
        }

        // Add new subscription data
        subscriptions.push(newSubscriptionData);

        // Write updated data to file
        fs.writeFile(
            subscriptionsPath,
            JSON.stringify(subscriptions, null, 2),
            'utf8',
            (err) => {
                if (err)
                    return res
                        .status(500)
                        .json({ message: 'Error writing subscription file' });

                res.json({
                    message: 'Subscription plans updated successfully',
                });
            }
        );
    });
});
//HANDLE EDIT AND UPDATE PLAN
router.put('/update-plans/:id', (req, res) => {
    const planId = req.params.id;
    const plansPath = path.join(
        __dirname,
        '..',
        'public',
        'data',
        'plans.json'
    );

    try {
        // Step 1: Read and parse the plans.json file
        const data = fs.readFileSync(plansPath, 'utf8');
        let plans = JSON.parse(data);

        // console.log('Existing plans:', plans); // Debugging: Check if the file was read correctly

        // Step 2: Find the plan by ID
        const planIndex = plans.findIndex((plan) => plan.plan_id === planId);
        if (planIndex === -1) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        console.log('Found plan:', plans[planIndex]); // Debugging: Check if the plan was found

        let features = req.body.features || [];

        if (!Array.isArray(features)) {
            features = [features];
        }

        // Filter out empty strings
        features = features.filter((feature) => feature.trim() !== '');
        // Step 3: Update the plan with new data
        const updatedPlan = {
            ...plans[planIndex],
            plan_title: req.body.plan_title || plans[planIndex].plan_title,
            plan_heading:
                req.body.plan_heading || plans[planIndex].plan_heading,
            plan_subscription:
                req.body.plan_subscription ||
                plans[planIndex].plan_subscription,
            plan_price: req.body.plan_price || plans[planIndex].plan_price,
            plan_url: req.body.plan_url || plans[planIndex].plan_url,
            plan_status: req.body.plan_status || plans[planIndex].plan_status,
            features: features || plans[planIndex].features,
        };

        console.log('Updated plan:', updatedPlan); // Debugging: Check the updated plan

        // Step 4: Replace the old plan with the updated one
        plans[planIndex] = updatedPlan;

        // Step 5: Write the updated plans array back to the JSON file
        fs.writeFileSync(plansPath, JSON.stringify(plans, null, 2), 'utf8');
        let fuck = req.body.features;
        res.json({ message: 'Plan updated successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to update plan' });
    }
});

//HANDLE THE DELETE PLAN
router.delete('/delete-plans/:id', (req, res) => {
    const planId = req.params.id;
    const plansPath = path.join(
        __dirname,
        '..',
        'public',
        'data',
        'plans.json'
    );

    // Step 1: Read the plans from the file
    fs.readFile(plansPath, 'utf8', (err, data) => {
        if (err)
            return res
                .status(500)
                .json({ message: 'Error reading plans file' });

        let plans;
        try {
            plans = JSON.parse(data);
        } catch (err) {
            return res
                .status(500)
                .json({ message: 'Error parsing plans file' });
        }

        // Step 2: Filter out the plan with the specified ID
        const updatedPlans = plans.filter((plan) => plan.plan_id !== planId);

        // Check if a plan was actually removed
        if (updatedPlans.length === plans.length) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Step 3: Write the remaining plans back to the file
        fs.writeFile(
            plansPath,
            JSON.stringify(updatedPlans, null, 2),
            'utf8',
            (err) => {
                if (err)
                    return res
                        .status(500)
                        .json({ message: 'Error writing plans file' });
                // console.log('Result:' +planId);
                res.json({ message: 'Plan deleted successfully' });
            }
        );
    });
});
// HANDLE THE ADD PLAN
router.post('/add-plan', (req, res) => {
    // Handle the features array, filtering out empty strings
    let features = req.body.features || [];

    if (!Array.isArray(features)) {
        features = [features];
    }

    // Filter out empty strings
    features = features.filter((feature) => feature.trim() !== '');

    // Construct the new plan object with an autogenerated plan_id
    const newPlan = {
        plan_id: uuidv4(),
        plan_title: req.body.plan_title,
        plan_heading: req.body.plan_heading,
        plan_subscription: req.body.plan_subscription,
        plan_price: req.body.plan_price,
        plan_url: req.body.plan_url,
        plan_status: req.body.plan_status || 'active',
        features: features, // Ensure features is an array and filter out empty strings
    };

    const plansPath = path.join(
        __dirname,
        '..',
        'public',
        'data',
        'plans.json'
    );
    console.log('Resolved path:', plansPath);

    mkdirp.sync(path.dirname(plansPath));

    fs.readFile(plansPath, 'utf8', (err, data) => {
        let plans = [];

        if (err) {
            if (err.code === 'ENOENT') {
                plans = [];
            } else {
                console.error('Failed to read plans file:', err);
                return res
                    .status(500)
                    .json({ message: 'Failed to read plans file' });
            }
        } else {
            try {
                plans = JSON.parse(data);
            } catch (err) {
                console.error('Error parsing plans file:', err);
                return res
                    .status(500)
                    .json({ message: 'Error parsing plans file' });
            }
        }

        plans.push(newPlan);

        fs.writeFile(
            plansPath,
            JSON.stringify(plans, null, 2),
            'utf8',
            (err) => {
                if (err) {
                    console.error('Failed to write plans file:', err);
                    return res
                        .status(500)
                        .json({ message: 'Failed to write plans file' });
                }

                res.json({
                    message: 'Plan added successfully',
                    plan_id: newPlan.plan_id,
                });
            }
        );
    });
});

// @desc Auth with Google
// @route GET /auth/google
router.get(
    '/google',
    (req, res, next) => {
        const refId = req.query.ref;
        req.session.refId = refId;
        req.session.save((err) => {
            if (err) return next(err);
            next();
        });
    },
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        keepSessionInfo: true,
    })
);

// @desc Google auth callback
// @route GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        res.redirect('/dashboard.html');
    }
);

router.get(
    '/twitter',
    (req, res, next) => {
        const refId = req.query.ref;
        req.session.refId = refId;
        req.session.save((err) => {
            if (err) return next(err);
            next();
        });
    },
    passport.authenticate('twitter', { keepSessionInfo: true })
);

router.get(
    '/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login.html' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/dashboard.html');
    }
);

// Local login route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        if (!user) {
            return res
                .status(400)
                .json({ message: info.message || 'Invalid credentials' });
        }
        req.logIn(user, async (err) => {
            if (err) {
                return res
                    .status(500)
                    .json({ message: 'Internal Server Error' });
            }
            user.isSignedIn = true;
            await user.save();
            return res.status(200).json({ message: 'Login successful' });
        });
    })(req, res, next);
});

router.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log('Admin not found');
            return res.status(400).send('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            console.log('Password does not match');
            return res.status(400).send('Invalid credentials');
        }

        req.login(admin, (err) => {
            if (err) {
                console.log('Error in login:', err);
                return res.status(500).send('Server error');
            }
            res.redirect('/admin-dashboard.html');
        });
    } catch (err) {
        console.log('Server error:', err);
        res.status(500).send('Server error');
    }
});

// @desc Register page
// @route GET /register
router.get('/register', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'register.html'))
);

router.get('/me', (req, res) => {
    const user = req.user; // `req.user` is populated by passport
    res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        subscriptionPlan: user.subscriptionPlan,
    });
});
router.post('/logout', async (req, res, next) => {
    if (req.isAuthenticated()) {
        try {
            const user = req.user;
            const isImpersonating = user.isImpersonated || false; // Check if the user is impersonating

            // Set the user as signed out and reset impersonation if necessary
            user.isSignedIn = false;
            if (isImpersonating) {
                user.isImpersonated = false; // Reset the impersonation flag
            }
            await user.save();

            // Log the user out
            req.logout((err) => {
                if (err) {
                    return next(err);
                }
                if (isImpersonating) {
                    res.redirect('/admin-dashboard.html'); // Redirect to admin dashboard if impersonating
                } else {
                    res.redirect('/login.html'); // Redirect to login page if not impersonating
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.redirect('/index.html');
    }
});

// router.post('/logout', async (req, res, next) => {
//     if (req.isAuthenticated()) {
//         try {
//             const user = req.user;
//             user.isSignedIn = false;
//             await user.save();
//             req.logout((err) => {
//                 if (err) {
//                     return next(err);
//                 }
//                 res.redirect('/login.html');
//             });
//         } catch (err) {
//             console.error(err);
//             res.status(500).json({ message: 'Internal server error' });
//         }
//     } else {
//         res.redirect('/index.html');
//     }
// });

router.get('/status', async (req, res) => {
    try {
        // Assuming you use session or token to identify the user

        const user = await User.findById(req.session.userId); // or use JWT token
        if (user && user.isSignedIn) {
            return res.json({ loggedIn: true });
        }
        res.json({ loggedIn: false });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    try {
        // Find the user with the given verification token
        let user = await User.findOne({ verificationToken: token });

        if (!user) {
            console.log('Token not found or expired in DB:', token);
            return res.status(400).json({ msg: 'Invalid or expired token' });
        }

        // Mark the user as verified
        user.isVerified = true;
        user.verificationToken = undefined;

        await user.save();

        res.redirect('/email-verified.html');
    } catch (err) {
        console.error('Server error:', err.message);
        res.status(500).send('Server error');
    }
});
module.exports = router;
