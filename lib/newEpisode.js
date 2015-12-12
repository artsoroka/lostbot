var $         = require('cheerio'); 
var Promise   = require('bluebird'); 
var webdriver = require('./webdriver'); 
var log       = require('./logger'); 
var sizeRgx   = /\d{1,4}.\d{1,3} (МБ|ГБ)/i; 

var getShowId = function(pageUrl){
    var url = pageUrl.match(/c=\d{1,5}/); 
    
    if( ! url || ! url.length ) {
        log.warn('could not get lostfilm show category'); 
        return null; 
    }
    
    var showId = url[0].match(/\d{1,5}/); 
    
    if( ! showId || ! showId.length ){
        log.warn('could not get show id from query string', showId); 
        return null; 
    } 
    
    return showId[0]; 
    
}; 

var getPageHTML = function(settings){
    
    var latestEpisode = '#Onwrapper > div:nth-child(5) > div:nth-child(2) > div.mid > div:nth-child(4) > div:nth-child(2) > table > tbody > tr:nth-child(2) > td:nth-child(2) > nobr > div > a.a_download'; 
    
    return new Promise(function(resolve, reject){
        
        var client = webdriver();         
        
        client
            .init()
            .url('http://www.lostfilm.tv') 
            .setViewportSize({
                width : 1280, 
                height: 1024
            })
            .setValue('div.prof input[name=login]', settings.username)
            .setValue('div.prof input[name=password]', settings.password)
            .click('input.form_b[type=submit]')
            .pause(1000)
            .url(settings.url)
            .pause(1000)
            .moveToObject(latestEpisode)
            .click(latestEpisode)
            .pause(1000)
            .windowHandles(function(err, windows){
                if( err ) throw err; 
                
                var popUp = windows.value[windows.value.length - 1]; 
                return client.window(popUp); 
            })
            .getHTML('body')
            .then(function(html){
                client.getUrl()
                    .then(function(pageUrl){
                        client.endAll(); 
                        resolve({
                            pageUrl: pageUrl, 
                            html   : html 
                        });
                    }); 
            })
            .catch(function(err){
                reject(err); 
            }); 

    });
    
};

var findLinks = function(page){
    var episodes = []; 
    return new Promise(function(resolve, reject){
        var doc    = $.load(page.html); 
        var links  = doc('td > a'); 
        var showId = getShowId(page.pageUrl); 
        
        if( ! links || ! links.length ) return reject('no links found'); 

        links.map(function(index, link){
            if( link.attribs && link.attribs.href ){
                
                var text = $(link).text(); 
                var show = getEpisodeDetails(text); 
                
                episodes.push({
                    link  : link.attribs.href, 
                    text  : text,
                    showId: showId, 
                    show  : show, 
                    size  : $(link).parent().text().match(sizeRgx)[0]
                });
                
            } 
        }); 
        
        resolve(episodes); 
        
    }); 
}; 

var getSeasonAndEpisode = function(str){
    var season  = str.match(/\d{1,2} сезон/); 
    var episode = str.match(/\d{1,2} серия/); 
    
    if( ! episode || ! season ){
        log.warn('could not find episode or season id in', str); 
        return null;   
    } 

    return {
        episode: episode[0].replace(' серия', ''),  
        season : season[0].replace(' сезон', '') 
    }; 
    
};

var getShowTitle = function(str){
    
    var title = str.split('('); 
    return {
        titleRus: title[0].trim(), 
        titleEng: title[1].replace(')', '') 
    }; 
}; 

var getEpisodeDetails = function(str){
    var arr     = str.split('.'); 
 
    if( arr.length < 3 ) return null;  
    
    var title   = getShowTitle(arr[0]);  
    var seEp    = getSeasonAndEpisode(arr[1]); 
    
    if( ! title || ! seEp ) return null; 
    
    return {
        titleEng: title.titleEng, 
        titleRus: title.titleRus, 
        season  : seEp.season, 
        episode : seEp.episode
    }; 
}; 

module.exports = function(settings){
    return getPageHTML({
        url     : settings.url, 
        username: settings.auth.username, 
        password: settings.auth.password
    })
    .then(function(page){
        return findLinks(page); 
    }); 
    
}; 