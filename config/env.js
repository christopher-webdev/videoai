require('dotenv').config();

const envVars = {
    ENV: process.env.NODE_ENV,
    APP_NAME: process.env.APP_NAME,
    APP_URL: process.env.APP_URL,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_SECRET: process.env.PAYPAL_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    TWITTER_SECRET: process.env.TWITTER_SECRET,
    TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
    MONGO_URL: process.env.MONGO_URL,

    STRIPE_REDIRECT_URL() {
        return `${this.APP_URL}/plans-billing.html?provider=stripe&action=retrieve_payment`;
    },
    'WEBHOOK.PAYPAL'() {
        return {
            url: `${this.APP_URL}/api/billings/webhooks/paypal.webhooks`,
            event_types: [
                { name: 'BILLING.SUBSCRIPTION.CREATED' },
                { name: 'BILLING.SUBSCRIPTION.ACTIVATED' },
                { name: 'BILLING.SUBSCRIPTION.CANCELLED' },
            ],
        };
    },

    'WEBHOOK.STRIPE'() {
        return {
            url: `${this.APP_URL}/api/billings/webhooks/paypal.webhooks`,
            event_types: [
                { name: 'BILLING.SUBSCRIPTION.CREATED' },
                { name: 'BILLING.SUBSCRIPTION.ACTIVATED' },
                { name: 'BILLING.SUBSCRIPTION.CANCELLED' },
            ],
        };
    },
    get(v) {
        return this[v];
    },
};

function getEnv(variable) {

    const vars = Object.keys(envVars);

    if (vars.includes(variable)) {
        return typeof envVars[variable] == 'function'
            ? envVars[variable]()
            : envVars[variable];
    }

    throw new Error(`No such variable: `+ variable);
}

module.exports = getEnv;
