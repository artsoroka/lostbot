var Promise = require('bluebird'); 
var request = require('request'); 
var fs      = require('fs'); 
var random  = require('random-string'); 
var config  = require('../config').App; 

var downloadFile = function(options){
    var url  = options.url;
    var dir  = options.outputDir; 
    var name = options.fileName; 
    var file = [dir, name].join('/'); 
    
    return new Promise(function(resolve, reject){
        
        var stream  = fs.createWriteStream(file); 
        
        stream.on('finish', function(){
             resolve({
                url     : url, 
                fileName: name, 
                episode : options.episode 
             }); 
        }); 
        
        request
            .get(url)
            .on('error', function(err) {
                reject(err);   
            })
            .pipe(stream);
        
    }); 
    
}; 

var downloadAll = function(links, result, callback){
    var episode = links.pop(); 
    
    downloadFile(episode).then(function(file){
        result.success = result.success.concat(file); 
        return ( links.length ) ? downloadAll(links, result, callback) 
                                : callback(result); 
    }).catch(function(err){
        result.errors = result.errors.concat({
            error  : err, 
            episode: episode
        }); 
    
        return ( links.length ) ? downloadAll(links, result, callback) 
                                : callback(result); 
        
    }); 
}; 

var createFileName = function(show){
    var title   = show.titleEng; 
    var season  = ['se', show.season].join('');  
    var episode = ['ep', show.episode].join(''); 
    var rand    = random({
        length: 4,
        numeric: false,
        letters: true,
        special: false
    }); 
    
    return title.replace(/ /g, '-') + rand + season + episode + '.torrent'; 

}; 

module.exports = function(episodeList){
    var outputDir = config.files.torrent_files_dir; 
    
    var acc = {
        success: [], 
        errors : [] 
    }; 
    
    var episodes = episodeList.map(function(episode){
        return {
            url      : episode.link, 
            outputDir: outputDir, 
            fileName : createFileName(episode.show), 
            episode  : episode 
        }; 
    }); 
    
    return new Promise(function(resolve, reject){
       
       downloadAll(episodes, acc, function(result){
           resolve(result); 
       }); 
        
    }); 
}; 