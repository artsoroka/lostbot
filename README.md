## Lostbot

A Telegram bot which takes a series title, season and episode and send back a video file 

**Dependencies** 

* node.js > 0.10 
* mysql/mariadb 
* docker 
* knex 

Nice to have [PM2](https://github.com/Unitech/pm2) process manager for node 

## Installation 

```
git clone https://github.com/artsoroka/lostbot && cd lostbot 

npm install 

``` 

Create database tables with Knex 

```
knex --cwd ./db migrate:latest 
```

Run application 

```
node app.js 
```

Also you should start workes in /workers directory 

* episodeMonitor.js  
* rssMonitor.js 
