const fp = require('fastify-plugin');
const database = require('better-sqlite3');
const path = require('path');
async function spendingLogsPlugins(fastify , option) {
    const db = new database(path.join(__dirname,'./spending__logs.db'));
    db.exec(`
        
        CREATE TABLE IF NOT EXISTS logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL , 
            chef_name TEXT NOT NULL ,
            amount REAL 
        );
        `);
        console.log('spending_logs DB is ready !');
        fastify.decorate('spending_logs_db' , db);

        fastify.addHook('onClose' , (instance, done) => {
        db.close();
        done();
    } )
    }


module.exports=fp(spendingLogsPlugins);