var fs = require('fs');

module.exports = function (config) {
    require('./less/style.less');

    return require('./app')(config);
};
