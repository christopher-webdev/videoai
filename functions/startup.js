const { Package: EPackage, allowedIntervals } = require('../enums/Package');
const AppConfig = require('../models/AppConfig');

const AppConfigTable = {
    earningPerUpgradedReferer: 'earningPerUpgradedReferer',
    earningPerUserReferered: 'earningPerUserReferered',
    affiliateErrorMessage: 'affiliateErrorMessage',
    widthdrawableAmount: 'withdrawableAmount',
};

module.exports.bootstrap = async function bootstrap() {
    if (
        !(await AppConfig.exists({
            name: AppConfigTable.earningPerUpgradedReferer,
        }))
    ) {
        const result = {};
        for (const i in allowedIntervals) {
            const interval = allowedIntervals[i];
            if (interval == 'unlimited') continue;

            result[interval] = [];

            for (const key in EPackage) {
                const pkg = EPackage[key];

                if (pkg.name.toLowerCase().includes(interval)) {
                    result[interval].push({
                        name: pkg.name,
                        amount: 0,
                    });
                }
            }
        }

        await AppConfig.create({
            name: AppConfigTable.earningPerUpgradedReferer,
            value: result,
        });
    }

    if (
        !(await AppConfig.exists({
            name: AppConfigTable.affiliateErrorMessage,
        }))
    ) {
        await AppConfig.create({
            name: AppConfigTable.affiliateErrorMessage,
            value: 'Insufficient Balance',
        });
    }

    if (
        !(await AppConfig.exists({ name: AppConfigTable.widthdrawableAmount }))
    ) {
        await AppConfig.create({
            name: AppConfigTable.widthdrawableAmount,
            value: 0,
        });
    }

    if (
        !(await AppConfig.exists({ name: AppConfigTable.earningPerUserReferered }))
    ) {
        await AppConfig.create({
            name: AppConfigTable.earningPerUserReferered,
            value: 0,
        });
    }
};

module.exports.AppConfigTable = AppConfigTable;
