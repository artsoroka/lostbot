module.exports = {
    App: {
        port: process.env.LB_PORT || 8080, 
        host: process.env.LB_HOST || 'localhost'
    }, 
    telegram: {
        token: process.env.LB_TELEGRAM_TOKEN,
        webhookUrl: process.env.LB_TELEGRAM_WEBHOOK || '/telegram_webhook'
    }
}; 