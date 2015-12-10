var config = require('../config'); 

var knex   = require('knex')({
    client: 'mysql',
    connection: config.db
});

module.exports = knex;