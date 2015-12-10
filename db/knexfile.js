var config = require('../config'); 

module.exports = {
    client: 'mysql',
    connection: config.db,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'migrations'
    }
};