var express    = require('express'); 
var app        = express(); 
var bodyParser = require('body-parser'); 
var config     = require('./config'); 

app.use(bodyParser.json()); 

app.get('/', function(req,res){
    res.send('welcome to lostbot');  
}); 
 
app.post(config.telegram.webhookUrl, function(req,res){
    console.log('got request'); 
    console.dir(req.body);
    res.status(200).send('OK'); 
}); 

var listener = app.listen(config.App.port, function(){
  console.log('App started on port', listener.address().port); 
}); 