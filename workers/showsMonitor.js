var $       = require('cheerio');
var _       = require('lodash'); 
var request = require('request'); 
var Promise = require('bluebird'); 
var Iconv   = require('iconv').Iconv;  
var encoder = new Iconv('windows-1251', 'utf-8'); 
var db      = require('../lib/db'); 
var log     = require('../lib/logger'); 
 
var fetchData = function(settings){
    return new Promise(function(resolve, reject){
        var link = {
            url     : settings.url,
            encoding: null
        }; 
        request.get(link, function(err, response, body){
            if( err ){
                ('connection error', err); 
                throw err; 
            }
   
            if( response.statusCode != 200 ){
                log.error('invalid status code', response.statusCode); 
                throw new Error('response status code is not 200 OK'); 
            }
            
            resolve( encoder.convert(body).toString() ); 
        
        }); 
    });
}; 

var findShows = function(html){
    return new Promise(function(resolve, reject){
        var doc     = $.load(html); 
        var content = doc('div.mid > div.bb > a.bb_a'); 
        var shows   = []; 
        
        for(var e in content){
        
            if( ! content[e].attribs || ! content[e].attribs.href ) continue; 
            
            var title = $(content[e]).text(); 
            var link  = content[e].attribs.href; 
            var id    = link.match(/\d{1,5}/)[0]; 
            shows.push({
                id      : parseInt(id),  
                link    : link,  
                title   : title, 
                titleRus: title.split('(')[0], 
                titleEng: title.split('(')[1].replace(')','')
            }); 
        }
        
        if( ! shows.length ) return reject('no shows found on the page'); 
        
        resolve(shows); 
    
    }); 
}; 

var findNewShows = function(newShows, existingShows){
    return new Promise(function(resolve, reject){
               
        var newIds      = _.pluck(newShows,      'id'); 
        var existingIds = _.pluck(existingShows, 'id'); 
        var diff        = _.difference(newIds, existingIds); 
        
        if( ! diff.length ) return resolve([]); 
        
        var newEntries  = newShows.filter(function(show){
            return _.includes(diff, show.id); 
        }); 
        
        resolve(newEntries); 
         
    }); 
}; 

var appendExistingShows = function(shows){
    return new Promise(function(resolve, reject){
            
        db
          .select('lostfilm_id as id')
          .from('shows')
          .then(function(existingShows){
            resolve({
                newShows: shows, 
                existingShows: existingShows
            }); 
          }); 
    }); 
}; 

module.exports = function(url){
    return fetchData({
        url: url
    })
    .then(function(html){
        return findShows(html); 
    })
    .then(function(shows){
        return appendExistingShows(shows); 
    })
    .then(function(data){
         return findNewShows(data.newShows, data.existingShows); 
    })
    .then(function(newShows){
        if( ! newShows || ! newShows.length ){
            log.info('no new shows found'); 
            return true; 
        } 
        var shows = newShows.map(function(show){
            return {
                lostfilm_id: show.id,
                title      : show.title, 
                title_eng  : show.titleEng, 
                title_rus  : show.titleRus
            }; 
        }); 
        
        return db('shows').insert(shows).then(function(){
            log.info(shows.length + ' new entries will be added to db'); 
        }); 
         
    })
    .then(function(){
        log.info('finished parsing shows list');  
    }); 
}; 
 
  
    

