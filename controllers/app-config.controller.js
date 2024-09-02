const express = require('express');
const AppConfig = require('../models/AppConfig');
const { AppConfigTable } = require('../functions/startup');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { c, query } = req.query;
        // switch (c) {
        //     case 'earningPerUpgradedReferer':
        //         {
        const response = await AppConfig.findOne({ name: c }, query);
        return res.status(200).json(response);
        //     }
        //     break;
        // default:
        // break;
        // }
    } catch (error) {
        console.log('🚀 ~ router.get ~ error:', error);
        res.status(500).json({ success: false, errors: error.message });
    }
});

router.put('/', async (req, res) => {
    const {c, query} = req.query
    switch (c) {
        case AppConfigTable.earningPerUpgradedReferer:
            try {
                const { key, ...payload } = req.body;
        
                const appConfig = await AppConfig.findOneAndUpdate(
                    { name: AppConfigTable.earningPerUpgradedReferer },
                    { $set: { [`value.${key}`]: payload[key] } },
                    { new: true, upsert: true }
                );
        
                return res.status(200).json(appConfig);
            } catch (error) {
                res.status(500).json({ success: false, errors: error.message });
            }
            break;
        case AppConfigTable.widthdrawableAmount:
            try {
                const { withdrawableAmount } = req.body;
        
                const appConfig = await AppConfig.findOneAndUpdate(
                    { name: AppConfigTable.widthdrawableAmount },
                    { $set: { value: withdrawableAmount } },
                    { new: true, upsert: true }
                );
        
                return res.status(200).json(appConfig);
            } catch (error) {
                res.status(500).json({ success: false, errors: error.message });
            }
            break;
    
        case AppConfigTable.earningPerUserReferered:
            try {
                const { amount } = req.body;
        
                const appConfig = await AppConfig.findOneAndUpdate(
                    { name: AppConfigTable.earningPerUserReferered },
                    { $set: { value: amount } },
                    { new: true, upsert: true }
                );
        
                return res.status(200).json(appConfig);
            } catch (error) {
                res.status(500).json({ success: false, errors: error.message });
            }
            break;
    
        default:
            break;
    }
});

module.exports = router;
