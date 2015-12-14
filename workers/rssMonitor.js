require('dotenv').config({path: __dirname + '/../.env'}); 

var _          = require('lodash'); 
var util       = require('util'); 
var schedule   = require('node-schedule'); 
var feedParser = require('../lib/feedParser'); 
var log        = require('../lib/logger'); 

schedule.scheduleJob('* * * * *', function(){
    
    feedParser('http://www.lostfilm.tv/rssdd.xml')
        .then(function(episodes){
           
            if( _.isEmpty(episodes) ) return; 
           
            var msg = 'feedParser: new episode of %s Se%dEp%d'; 
           
            episodes.map(function(episode){
                log.info(util.format(msg, episode.titleEng, episode.season, episode.episode)); 
            }); 
            
        })
        .catch(function(err){
            console.log('feedParser:', err); 
        }); 

});