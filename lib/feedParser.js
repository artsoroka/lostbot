require('dotenv').config({path: __dirname + '/../.env'});

var FeedParser = require('feedparser'); 
var Promise    = require('bluebird'); 
var request    = require('request'); 
var Iconv      = require('iconv').Iconv;
var db         = require('./db'); 
var log        = require('./logger'); 
var _          = require('lodash'); 

var readRssFeed = function(url){
    return new Promise(function(resolve, reject){
                
        var req = request(url); 
        var feedparser = new FeedParser(); 
        var data =[];
        
        var maybeTranslate = function(res, charset) {
          var iconv;
          // Use iconv if its not utf8 already.
          if (!iconv && charset && !/utf-*8/i.test(charset)) {
            try {
              iconv = new Iconv(charset, 'utf-8');
              console.log('Converting from charset %s to utf-8', charset);
              iconv.on('error', function(e){console.log(e)});
              // If we're using iconv, stream will be the output of iconv
              // otherwise it will remain the output of request
              res = res.pipe(iconv);
            } catch(err) {
              res.emit('error', err);
            }
          }
          return res;
        }; 
        
        
        req.on('error', function (error) {
            reject(error); 
        });
        
        
        req.on('response', function(res) {
        
            if (res.statusCode != 200) 
                return this.emit('error', new Error('Bad status code'));
            
            var charset = 'windows-1251'; 
            res = maybeTranslate(res, charset);
            res.pipe(feedparser);
        
        });
        
        feedparser.on('error', function(error) {
            reject(error); 
        });
        
        feedparser.on('readable', function() {
            var stream = this; 
            // **NOTE** the "meta" is always available in the context of the feedparser instance
            var meta = this.meta; 
            var item;
            
            while( item = stream.read() ) {
                data.push(item); 
            }
        }); 
        
        feedparser.on('end', function(){
            resolve(data); 
        }); 

    }); 
}; 

var getShowTitle = function(str){
    if( _.isEmpty(str) ) return null; 
    
    return _.first(str.split('.')); 
    
}; 

var getEngTitle = function(str){
    return _.last(str.split('(')).replace(')','');
}; 

var epEsRegx    = /S\d{1,2}E\d{1,2}/; 
var episodeRegx = /E\d{1,2}/; 
var seasonRegex = /S\d{1,2}/; 

var getSeasonAndEpisode = function(str){
    if( _.isEmpty(str) ) return null; 
    
    var show = _.first( str.match(epEsRegx) ); 
    
    if( _.isEmpty(show) ) return null; 
    
    var episode = _.first(show.match(episodeRegx)); 
    var season  = _.first(show.match(seasonRegex));
    
    if( _.isEmpty(episode) || _.isEmpty(season) ) return null; 
    
    return {
        episode: parseInt(episode.replace('E','')), 
        season : parseInt(season.replace('S',''))
    }; 
    
}; 

var compare = function(newEpisodes, existingEpisodes){
    
    var getShowIdByName = existingEpisodes.reduce(function(acc, show){
        acc[show.title_eng] = show.lostfilm_id;  
        return acc; 
    }, {});
                
    var existing = existingEpisodes.reduce(function(acc,e){
        acc[e.title_eng] = acc[e.title_eng] || {}; 
        acc[e.title_eng][e.season_id] = acc[e.title_eng][e.season_id] || {}; 
        acc[e.title_eng][e.season_id][e.episode_id] = e.lostfilm_id; 
        return acc; 
    }, {}); 
    
    return newEpisodes.filter(function(e){
    
        return  ! existing[e.titleEng] 
                || ! existing[e.titleEng][e.season] 
                || ! existing[e.titleEng][e.season][e.episode];
    
    }).map(function(e){
        e.lostfilm_id = getShowIdByName[e.titleEng]; 
        return e; 
    }); 
    
}; 

var checkForNewEpisodes = function(episodes){
    
    return new Promise(function(resolve, reject){
        var titles = _.pluck(episodes, 'titleEng'); 
        
        log.info('checking episodes for these shows', titles); 
        
        db('shows')
            .select([
                'shows.title_eng',
                'shows.lostfilm_id',
                'episodes.season_id', 
                'episodes.episode_id'
            ])
            .leftOuterJoin('episodes', 'episodes.lostfilm_id', 'shows.lostfilm_id')
            .whereIn('title_eng', titles)
         
            .then(function(existingEpisodes){
                var newEpisodes = compare(episodes, existingEpisodes); 
                resolve(newEpisodes); 
            }); 
            
    }); 
}; 

module.exports = function(url){
    return readRssFeed(url)
    .then(function(data){
        
        if( _.isEmpty(data) ) 
            throw new Error('rss feed has no data'); 
        
        var episodes = data.map(function(episode){
            return {
                text   : episode.title, 
                link   : episode.link, 
                title  : getShowTitle(episode.title) 
            }; 
        }).reduce(function(acc,e){
            acc[e.title] = {
                link: e.link, 
                text: e.text
            }; 
            return acc; 
        }, {}); 
        
        return _.map(episodes, function(episode, title){
            var epEs = getSeasonAndEpisode(episode.text) || {}; 
            
            return {
                title   : title,
                titleEng: getEngTitle(title), 
                episode : epEs.episode, 
                season  : epEs.season, 
                link    : episode.link
            }; 
            
        }); 
             
    })
    .then(function(episodeList){
            return checkForNewEpisodes(episodeList);  
    }) 
    .then(function(newEpisodes){

        if( _.isEmpty(newEpisodes) ){
            log.info('no new episodes found in this request'); 
            return null;   
        }
        
        log.info('rss feed contains ' + newEpisodes.length + ' new episodes'); 

        var episodes = newEpisodes.map(function(e){
            return {
                lostfilm_id: e.lostfilm_id, 
                season_id  : e.season, 
                episode_id : e.episode,
                link       : e.link 
            };  
        }); 
        
        return new Promise(function(resolve, reject){
            db('episodes')
                .insert(episodes)
                .then(function(){
                    resolve(newEpisodes); 
                }); 
        }); 
        
    })
}; 