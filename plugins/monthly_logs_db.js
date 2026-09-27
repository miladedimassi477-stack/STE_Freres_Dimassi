const database = require('better-sqlite3');
const fp = require('fastify-plugin');
async function monthly_logs_plugin (fastify , option) {
    const db = new database('./monthly_logs.db');
    db.exec(`
        
        `);
        fastify.decorate('monthly_logs'  ,  db );
        console.log('monthly_logs database is running ! ');
        fastify.addHook('onClose' , async(instance, done )=>{
            db.close();
            done();
        })
};
module.exports = fp(monthly_logs_plugin);
