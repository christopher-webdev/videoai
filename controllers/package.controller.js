const express = require('express');
const Package = require('../models/Package');
const { User } = require('../models/User');
const {
    createPaypalProducts,
    createStripeProductAndPrices,
} = require('../functions/helpers');
const {
    createPackageBenefits,
    getAvailablePackages,
} = require('../functions/helpers');
const { ensureAdminAuthenticated } = require('../middleware/auth');
const { allowedPackages, allowedIntervals } = require('../enums/Package');

const router = express.Router();

router
    .route('/')
    .post(async (req, res) => {
        try {
            const {
                packages: { name, interval, amount, benefits, isAvailable },
            } = req.body;

            const packageExists = await Package.findOne({ name });

            if (packageExists) {
                res.status(400).json({
                    success: false,
                    errors: `Package name '${name}' already exists`,
                });
                return;
            }

            // create the package
            const package = await Package.create({
                name,
                interval,
                amount,
                benefits,
            });

            if (!name?.includes('Free')) {
                let priceId, productId;
                try {
                    priceId = await createStripeProductAndPrices({
                        name,
                        amount,
                        interval,
                    });
                } catch (error) {
                    priceId = await createStripeProductAndPrices({
                        name,
                        amount,
                        interval,
                    });
                }

                try {
                    productId = await createPaypalProducts({ name });
                } catch (error) {
                    productId = await createPaypalProducts({ name });
                }

                await package.updateOne({
                    stripePriceId: priceId,
                    paypalProductId: productId,
                });
            }

            res.status(201).json({
                success: true,
                data: package.id,
            });
        } catch (error) {
            console.log('🚀 ~ router.route ~ create - error:', error);
            res.status(500).json({
                success: false,
                errors: 'Unable to create package ' + error.message,
            });
        }
    })

    // ensureAdmin
    .get(async (req, res) => {
        try {
           
            const user = await User.findById(req.user._id);

            const pkgs = await Package.find({});

            res.status(200).json({
                success: true,
                data: {
                    pkgs,
                    activePlan: user.subscriptionPlan
                },
            });
        } catch (error) {
            console.log('🚀 ~ .get ~ get: - error', error);
            res.status(500).json({
                success: false,
                errors: 'Unable to get all packages ' + error.message,
            });
        }
    });

router.get('/list', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            allowedPackages,
            allowedIntervals,
        },
    });
});

router
    .route('/benefits')
    .post(async (req, res) => {
        try {
            const { benefits, packageId } = req.body;
            const benefitId = await createPackageBenefits(packageId, benefits);
            res.status(201).json({ success: true, data: benefitId });
        } catch (error) {
            console.log('🚀 ~ router.route ~ create - error:', error);
            res.status(500).json({
                success: false,
                errors: 'Unable to create package ' + error.message,
            });
        }
    })
    .put(async (req, res) => {
        try {
            const { benefits, packageId } = req.body;
            const benefitId = await Package.findByIdAndUpdate(packageId, {
                $set: { benefits },
            });
            res.status(201).json({ success: true, data: benefitId });
        } catch (error) {
            console.log('🚀 ~ router.route ~ create - error:', error);
            res.status(500).json({
                success: false,
                errors: 'Unable to create package ' + error.message,
            });
        }
    });

router
    .route('/:id')
    .get(async (req, res) => {
        try {
            const { id } = req.params;
            const pkg = await Package.findOne({ _id: id });
            res.status(200).json({ success: true, data: pkg });
        } catch (error) {
            console.log('🚀 ~ .get ~ get: - error', error);
            res.status(500).json({
                success: false,
                errors: 'Unable to get package ' + error.message,
            });
        }
    })
    .put(async (req, res) => {
        try {
            const { benefits, ...data } = req.body.packages;
            const { id } = req.params;
            const pkg = await Package.findOneAndUpdate(
                { _id: id },
                { $set: { benefits }, ...data }
            );
            res.status(200).json({ success: true, data: pkg });
        } catch (error) {
            console.log('🚀 ~ .get ~ get: - error', error);
            res.status(500).json({
                success: false,
                errors: 'Unable to update package ' + error.message,
            });
        }
    })
    .delete(async (req, res) => {
        try {
            const { id } = req.params;
            await Package.findOneAndDelete({ _id: id });
            res.sendStatus(204);
        } catch (error) {
            console.log('🚀 ~ .get ~ get: - error', error);
            res.status(500).json({
                success: false,
                errors: 'Unable to delete package ' + error.message,
            });
        }
    });

module.exports = router;
