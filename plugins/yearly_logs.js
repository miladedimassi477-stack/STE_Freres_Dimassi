const fp = require('fastify-plugin');
const database = require ('better-sqlite3');
const path = require('path');
async function yearly_logs_plugins(fastify , option) { 
    const db = new database(path.join(__dirname , 'yearly_logs.db'));
    db.exec(`
    CREATE TABLE IF NOT EXISTS workers_logs (
    worker_id         INTEGER PRIMARY KEY,
    attandence_score  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS vehiculs_logs (
    type_id                 INTEGER PRIMARY KEY,
    nomber_of_vehicules_out INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS money_logs (
    month_id       INTEGER PRIMARY KEY,
    money_in       INTEGER NOT NULL DEFAULT 0,
    money_out      INTEGER NOT NULL DEFAULT 0
    );
        `);
        console.log("yearly logs db is running ! ");
        fastify.addHook('onClose' , (instance , done )=> {
            db.close();
            done();
        })
        fastify.decorate('yearly_logs_db' , db);
}
module.exports=fp(yearly_logs_plugins);