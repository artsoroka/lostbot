var Promise = require('bluebird'); 
var WebTorrent = require('./webtorrent'); 
var fs = require('fs'); 
var parser = require('parse-torrent'); 

module.exports = function(config){
  return new Promise(function(resolve, reject){
    var file   = parser(fs.readFileSync(config.file));  

    var client = new WebTorrent(); 

    client.download(file, function (torrent) {
      console.log('Torrent info hash:', torrent.infoHash); 

      torrent.on('done', function(){
        console.log('download is complete'); 
        resolve({
          file: config.outputFile, 
          size: fs.statSync(config.outputFile) 
        }); 
      }); 

      torrent.files.forEach(function (file) {
        // Stream each file to the disk
        var source = file.createReadStream(); 
        var destination = fs.createWriteStream(config.outputFile); 
        source.pipe(destination); 
      }); 

    }); 

  }); 

}; 
