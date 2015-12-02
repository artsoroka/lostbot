var Promise = require('bluebird'); 
var request = require('request'); 
var qs      = require('querystring'); 

var Telegram = function(token){
    this._baseUrl = 'https://api.telegram.org'; 
    this._token   = token; 
}; 

Telegram.prototype.composeUrl = function(method){
    return [this._baseUrl, ['bot', this._token].join(''), method].join('/'); 
}; 

Telegram.prototype.getMe = function(){
    return this._call('getMe', []); 
};

Telegram.prototype.sendMessage = function(message){
    return this._call('sendMessage', message); 
};

Telegram.prototype.setWebhook = function(params){
    return this._call('setWebhook', params); 
};

Telegram.prototype.removeWebhook = function(){
    return this._call('setWebhook', {url: null}); 
};

Telegram.prototype._call = function(method, params){
    var self = this; 
    return new Promise(function(resolve,reject){
        var url = [self.composeUrl(method), qs.stringify(params)].join('?');  
        request.get(url, function(err, response, body){
            if( err ) return reject(err); 
            if( response.statusCode != 200 ){
                console.log(body); 
                return reject('response status is not 200 OK' + response.statusCode); 
            } 
        
            try{
                var data = JSON.parse(body); 
            } catch(e){
                return reject(e); 
            }
            if( data.ok != true && data.result != true)
                return reject('invalid response' + data); 
            
            resolve(data.result); 
                
        }); 
    }); 
}; 

module.exports = Telegram; 