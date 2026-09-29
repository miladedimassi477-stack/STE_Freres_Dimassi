const database = require('better-sqlite3');
const fp = require('fastify-plugin');
const path = require ('path')
async function monthly_logs_plugin (fastify , option) {
    const db = new database(path.join(__dirname,'monthly_logs.db'));
    db.pragma('foreign_keys = ON');
    db.exec(`
    CREATE TABLE IF NOT EXISTS items_logs (
    chefs_name     TEXT PRIMARY KEY ,
    amount         REAL DEFAULT 0 ; 
    
    );

    CREATE TABLE IF NOT EXISTS attandence_logs (
        worker_id   INTEGER PRIMARY KEY,
        days_worked TEXT DEFAULT "AAAAAA"
    );

    CREATE TABLE IF NOT EXISTS wages (
        week_id      INTEGER PRIMARY KEY AUTOINCREMENT ,
        amount_given REAL
    );

    CREATE TABLE IF NOT EXISTS money_in (
        money_in_id INTEGER PRIMARY KEY AUTOINCREMENT,
        type        TEXT, --checks or repaires
        amount      REAL,
        date        TEXT   
    );
        `);
        fastify.decorate('monthly_logs_db'  ,  db );
        console.log('monthly_logs database is running ! ');
        fastify.addHook('onClose' , (instance, done )=>{
            db.close();
            done();
        })
};
module.exports = fp(monthly_logs_plugin);