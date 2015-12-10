var schedule     = require('node-schedule');
var showsMonitor = require('./workers/showsMonitor'); 
var log          = require('./lib/logger'); 

schedule.scheduleJob('* * * * *', function(){
      
    showsMonitor('http://www.lostfilm.tv/serials.php')
        .catch(function(err){
            log.err('an error occured', err); 
        });

});
