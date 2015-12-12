require('dotenv').config({path: __dirname + '/../.env'}); 

var Promise       = require('bluebird'); 
var getNewEpisode = require('../lib/newEpisode'); 
var downloadFiles = require('../lib/fileDownloader'); 
var db            = require('../lib/db'); 
var redis         = require('../lib/redis'); 
var log           = require('../lib/logger'); 
var lostFilm      = require('../config').lostfilm;

var runSeries = function(taskList, result, callback){
    var task = taskList.pop();  
    
    getNewEpisode(task)
        .then(function(episodes){
            log.info('got episode download links for', task.url); 
            result.success = result.success.concat(episodes);  
        
            return ( taskList.length ) ? runSeries(taskList, result, callback) : callback(result);  
            
        }).catch(function(err){
            log.error('getNewEpisode: could not get episode files', task.url) ;
            result.errors = result.errors.concat(task.url);
            log.error('getNewEpisode:', err.message); 
            
            return ( taskList.length ) ? runSeries(taskList, result, callback) : callback(result);  
            
        });    
    
}; 

var getNewEpisodeLinks = function(links){
    return new Promise(function(resolve, reject){
        var acc = {
           success: [],
           errors : []
        }; 
        var episodeList = links.map(function(link){
            return {
                url : link, 
                auth: lostFilm
            }; 
        }); 
        runSeries(episodeList, acc, function(result){
            resolve(result); 
        }); 
    }); 
};

var getData = function(string){

    try{
        var data = JSON.parse(string); 
    } catch(e){
        log.error('could not parse an incoming message', string); 
    }
    
    return ( data ) ? data : null; 
    
}; 

var sizeInGb = function(str){
    
    if( ! str ) return null; 
    
    if( str.match('ГБ') )
        return parseFloat(str); 
    
    if( str.match('МБ') )
        return parseFloat(str) / 1024; 
    
    return null; 
    
}; 

redis.on('message', function(chan, msg){
    var links = getData(msg); 
    
    if( ! links ) return; 
    
    log.info('episodeMonitor: starting new task'); 

    getNewEpisodeLinks(links)
        .then(function(episodes){
            
            if( ! episodes.success || ! episodes.success.length )
                throw('episode list is empty, no files to download'); 
        
            log.info('got new episode data', episodes.success.length); 
        
            return downloadFiles(episodes.success); 
        })
        .then(function(result){
            
            if( ! result.success || ! result.success.length )
                throw('no episode data, no files for ', result.errors); 
            
            var newEpisodes = result.success.map(function(e){
                return {
                    lostfilm_id : e.episode.showId, 
                    season_id   : e.episode.show.season,
                    episode_id  : e.episode.show.episode,  
                    title       : e.episode.title, 
                    link        : e.url, 
                    torrent_file: e.fileName, 
                    size        : sizeInGb(e.episode.size) 
                }; 
            }); 
            
            log.info('episodeMonitor: will add new entries to episodes table ', newEpisodes.length); 
            
            db('episodes')
                .insert(newEpisodes)
                .then(function(){
                    log.info('episodeMonitor: new episodes saved to db');     
                })
                .catch(function(err){
                    log.error('episodeMonitor: db error', err); 
                }); 
            
        })
        .catch(function(err){
            log.error('episodeMonitor:', err); 
        }); 

}); 

redis.subscribe('new episode'); 