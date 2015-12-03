var http    = require('http'); 
var teleBot = require('./lib/telegramBot'); 
var bot     = teleBot.bot; 

var server = http.createServer(teleBot.server);  

bot.on('message', function(req){
    console.log('new message', req); 
}); 

bot.on('photo', function(req){
    console.log('new image'); 
    console.dir(req); 
});

var listener = server.listen(8080, function(){
  console.log('App started on port', listener.address().port); 
}); 