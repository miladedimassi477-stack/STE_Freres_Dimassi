const fp = require('fastify-plugin'); //widen file scoop 
const database = require('better-sqlite3');
async function inOutLogsPlugins(fastify , option) {
    const db = new database( "in_out_logs_db.db");
    db.exec (`
        CREATE TABLE IF NOT EXISTS types (
            type_id INTEGER PRIMARY KEY AUTOINCREMENT,
            type_name TEXT ,
            price REAL  
    );

        CREATE TABLE IF NOT EXISTS vehicule (
            vehicule_id INTEGER PRIMARY KEY AUTOINCREMENT, 
            type_id INTEGER NOT NULL ,
            numero_serie INTEGER , 
            description TEXT ,
            FOREIGN KEY (type_id) REFERENCES types(type_id)
        ); 
        CREATE TABLE IF NOT EXISTS out_logs (
            out_id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicule_id INTEGER ,
            date_of_exit TEXT,
            FOREIGN KEY (vehicule_id) REFERENCES vehicule(vehicule_id)
                
        );

        CREATE TABLE IF NOT EXISTS in_logs (
            in_id INTEGER PRIMARY KEY AUTOINCREMENT ,
            vehicule_id INTEGER ,
            date_of_exit TEXT,
            FOREIGN KEY (vehicule_id) REFERENCES vehicule(vehicule_id)

        );
        
    `);
    console.log('vehicule_logs DB is ready !');
    fastify.decorate('in_out_logs_db',db)
    fastify.addHook('onClose' , (instance , done ) => {
    db.close();
        done();
    }) 
        
    
}
module.exports=fp(dbpluging);



