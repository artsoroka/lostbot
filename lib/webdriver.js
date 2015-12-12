var webdriverio = require('webdriverio');
var options     = require('../config').webdriver; 

module.exports = function(){
    return webdriverio.remote(options);
}; 