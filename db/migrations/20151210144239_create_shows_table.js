exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('shows', function(table){
            table.charset('utf8'); 
            table.collate('utf8_unicode_ci'); 

            table.increments(); 
            table.integer('lostfilm_id').unsigned();
            table.string('title', 255); 
            table.string('title_eng', 255); 
            table.string('title_rus', 255); 
            table.timestamp("created_at").defaultTo(knex.raw('now()')); 
            table.timestamp("updated_at"); 
        })      
    ]);
};

exports.down = function(knex, Promise) {
    knex.schema.dropTableIfExists('shows');   
};
