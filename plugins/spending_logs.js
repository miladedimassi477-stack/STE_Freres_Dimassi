const fp = require('fastify-plugin');
const database = require('better-sqlite3');


async function fpplugin(fastify , option) {
    const db = new database('./spending__logs.db');
    db.exec(`
        CREATE TABLE IF NOT EXISTS chefs (
        chef_id INTEGER PRIMARY KEY AUTOINCREMENT,
        chef_name TEXT NOT NULL     
    );
        CREATE TABLE IF NOT EXISTS item (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT ,
            name TEXT NOT NULL , 
            price REAL NOT NULL ,
            date_of_log TEXT NOT NULL 
        );
        CREATE TABLE IF NOT EXISTS logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL , 
            chef_id INTEGER NOT NULL ,
            FOREIGN KEY (item_id) REFERENCES item(item_id),
            FOREIGN KEY (chef_id) REFERENCES chefs(chef_id) 
        );
        `);
        console.log('spending_logs DB is ready !');
        fastify.decorate('spending_logs_db' , db);

        fastify.addHook('onClose' , (instance, done) => {
        db.close();
        done();
    } )
    }


module.exports=fp(fpplugin);