exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('episodes', function(table){
            table.charset('utf8'); 
            table.collate('utf8_unicode_ci'); 

            table.increments(); 
            table.integer('lostfilm_id').unsigned();
            table.integer('season_id'); 
            table.integer('episode_id'); 
            table.string('title', 255);  
            table.string('link', 255); 
            table.string('torrent_file', 255); 
            table.string('size', 25); 
            table.timestamp("created_at").defaultTo(knex.raw('now()')); 
            table.timestamp("updated_at"); 
        })      
    ]);
};

exports.down = function(knex, Promise) {
    knex.schema.dropTableIfExists('episodes');   
};
