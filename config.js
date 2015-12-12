module.exports = {
    App: {
        port: process.env.LB_PORT || 8080, 
        host: process.env.LB_HOST || 'localhost',
        files: {
            torrent_files_dir: __dirname + '/torrent_files'
        }
    }, 
    db: {
	    user     : process.env.LB_DB_USER || 'dbadmin', 
	    password : process.env.LB_DB_PSWD, 
	    database : process.env.LB_DB_NAME || 'lostbot', 
	    port     : process.env.LB_DB_PORT || 3306
	}, 
    log: {
        papertrail: {
            host: process.env.PAPERTRAIL_HOST, 
            port: process.env.PAPERTRAIL_PORT,  
            program: 'lostbot', 
            colorize: true
        }
    }, 
    webdriver: { 
        desiredCapabilities: { 
            browserName: 'chrome' 
        }, 
        host: process.env.WEBDRIVER_HOST, 
        port: process.env.WEBDRIVER_PORT
    }, 
    lostfilm: {
        username: process.env.LOSTFILM_USER, 
        password: process.env.LOSTFILM_PSWD 
    }, 
    telegram: {
        token: process.env.LB_TELEGRAM_TOKEN,
        webhookUrl: process.env.LB_TELEGRAM_WEBHOOK || '/telegram_webhook'
    }
}; 