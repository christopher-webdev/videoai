// models/User.js
const mongoose = require('mongoose');
const { allowedPackages, Package: EPackage } = require('../enums/Package');
const Package = require('./Package');
// Credit Schema
const CreditSchema = new mongoose.Schema({
    feature: {
        type: String,
        enum: [
            'videoEditor',
            'videoRestyle',
            'videoVoicing',
            'lipSync',
            'faceSwap',
            '3dVideoModeling',
            'myAvatar',
        ],
        required: true,
    },
    credits: {
        type: Number,
        default: 0,
    },
});

// Subscription Plan Schema
const SubscriptionPlanSchema = new mongoose.Schema({
    plan: {
        type: String,
        enum: allowedPackages.map((pkg) => pkg.name),
        // enum: [
        //     'Free',
        //     'BasicMonthly',
        //     'PremiumMonthly',
        //     'BasicYearly',
        //     'PremiumYearly',
        // ],
        required: true,
    },
    credits: [CreditSchema],
});

// User Schema
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    profilePicture: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    isSignedIn: {
        type: Boolean,
        default: false,
    },
    subscriptionPlan: {
        type: String,
        enum: allowedPackages.map((pkg) => pkg.name),
        default: EPackage.Free.name,
    },
    activePackage: { type: mongoose.Types.ObjectId, ref: 'Package' },
    activePackageExpiresAt: {
        type: Date,
    },
    paymantProvider: { type: mongoose.Types.ObjectId, ref: 'PaymentProvider' },

    verificationToken: {
        type: String,
    },
    googleId: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    referral_id: {
        type: String,
    },
    credits: [CreditSchema],
    referral: {
        type: String,
    },
    referredBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    referral_count: {
        type: String,
    },
    address: {
        type: String,
    },
    isImpersonated: {
        type: Boolean,
        default: false,
    },
    // total_earned: {
    //     type: Number,
    //     default: 0
    // },
    credits: [CreditSchema],
});

// Affiliate system Schema
const WithdrawalRequest = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    total_referred: {
        type: String,
    },
    requestdate: {
        type: String,
    },
    WithdrawalRequestStatus: {
        type: String,
    },
});

// Affiliate system Schema/////////////////////////////////////////////////////////////
const AffiliateSystem = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    limit: {
        type: String,
        required: false,
    },
    price: {
        type: String,
    },
    signupEarning: {
        type: Number,
        default: 0,
    },
    affiliateEarning: {
        type: Number,
        default: 0,
    },
});
// Affiliate system Schema
const AffiliatereditInformation = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    Paypal: {
        type: String,
    },
    CardNumber: {
        type: String,
    },
    CardName: {
        type: String,
    },
    Expiringdate: {
        type: String,
    },
});
//create model referral_system
const RequestSystem = mongoose.model('ReferralRequest', WithdrawalRequest); // Create model referral_system
const ReferralPayment = mongoose.model(
    'ReferralPayments',
    AffiliatereditInformation
);
const AffiliateSys = mongoose.model('Affiliatesystems', AffiliateSystem);

// Create models from schemas
const User = mongoose.model('User', UserSchema);
const SubscriptionPlan = mongoose.model(
    'SubscriptionPlan',
    SubscriptionPlanSchema
);

// Export models as an object
module.exports = {
    User,
    SubscriptionPlan,
    CreditSchema,
    RequestSystem,
    ReferralPayment,
    AffiliateSys,
};
