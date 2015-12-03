var commandRegxp  = /^\/(watch|play)/i; 
var showRegxp     = /(SE)(( ){0,})?[0-9]{1,3}(( ){0,})(EP)(( ){0,})?[0-9]{1,3}/i; 
var seasonRegexp  = /(SE)(( ){0,})?[0-9]{1,3}/i; 
var episodeRegexp = /(EP)(( ){0,})?[0-9]{1,3}/i; 

module.exports.isCommand = function(string){
    if( ! string.length ) return false; 
    var cmd = string.match(commandRegxp); 
    
    if( ! cmd ) return false; 
    
    return cmd[0]; 
}; 
    
module.exports.getShow = function(string){

    var cmd = (cmd = string.match(commandRegxp)) ? cmd[0] : null; 
    
    if( ! cmd ) return null; 
    
    string = string.replace(cmd, ''); 
    
    var show = (show = string.match(showRegxp)) ? show[0] : null;  
 
    if( ! show ) return null; 
    
    var episode = ( show.match(episodeRegexp) ) ? show.match(episodeRegexp)[0] : null; 
    var season  = ( show.match(seasonRegexp) ) ? show.match(seasonRegexp)[0] : null; 
    
    if( ! episode || ! season ) return null;  
    
    var title = string.replace(show, '').trim(); 
    
    return {
        title: title, 
        episode: episode, 
        season: season, 
        command: cmd
    }; 
    
}; 