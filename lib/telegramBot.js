var EventEmitter = require('events').EventEmitter; 
var express      = require('express'); 
var bodyParser   = require('body-parser'); 
var app          = express(); 
var emitter      = new EventEmitter(); 
var config       = require('../config');  

app.use(bodyParser.json()); 

app.get('/', function(req,res){
    res.send('lostbot webhook api');  
}); 
 
app.post(config.telegram.webhookUrl, function(req,res){

    res.status(200).send('OK'); 

    if( req.body == undefined || req.body.message == undefined )
        return emitter.emit('error', 'invalid webhook request'); 
        
    if( req.body.message.text != undefined )
        return emitter.emit('message', req.body); 
    
    if( req.body.message.photo != undefined )
        return emitter.emit('photo', req.body); 
    
}); 


module.exports.server = app;
module.exports.bot    = emitter; 