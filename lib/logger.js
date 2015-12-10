var winston = require('winston');
var config  = require('../config').log; 
require('winston-papertrail').Papertrail;

var transports = [
    new winston.transports.Console({
        prettyPrint: true, 
        colorize: true
    })
]; 

if(config.papertrail){
    var remoteLogger = new winston.transports.Papertrail(config.papertrail); 
    transports.push(remoteLogger); 
}

module.exports = new winston.Logger({
    transports: transports
});