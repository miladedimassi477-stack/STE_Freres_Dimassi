import Fastify from 'fastify';
import dbPlugin from './plugins/HRMS_db.js';
import inOutLogsPlugins from './plugins/vehicule_logs.js';
import spendingLogsPlugins from './plugins/spending_logs.js';
const fastify = Fastify({logger : true });

fastify.register(dbPlugin);
fastify.register(inOutLogsPlugins);
fastify.register(spendingLogsPlugins);
/*usefull : 
hrms_db for acces for the HRMS Database 
vehicule_db -> in_out_logs_db 
spending logs is spending_logs_db

*/

//routes : 

//HRMS routes 

//add worker  
fastify.post('/hrms/worker' , async (req , res ) =>{
    const {wk_id , wk_name , wk_salary , wk_monthly_deposit} = req.body;
    const info = fastify.hrms_db.prepare('insert into workers (worker_id , worker_name , worker_salary , worker_monthly_deposit ) VALUES (?,?,?,?)').run(wk_id , wk_name , wk_salary , wk_monthly_deposit)
    res.code(201);
    return {worker_id : info.lastInsertRowid};
});
//search worker 
fastify.get('/hrms/worker/:wk_id' , async(req , res ) => {
    return fastify.hrms_db.prepare('select * from workers where worker_id = ? ').get(req.params.wk_id) ; 
})
//delete worker 
fastify.delete('/hrms/worker/:wk_id' , async (req  , res) => {
    const info = fastify.hrms_db.prepare('delete from workers where worker_id = ? ' ).run(req.params.wk_id);
    res.code(202);
    return {deleted : info.changes } ; 

})
//modifier worker 
fastify.put('/hrms/worker', async (req , res ) => {
    const {wk_id , wk_name , wk_salary , wk_monthly_deposit} = req.body;
    const info = fastify.hrms_db.prepare('update workers set worker_name = ? , worker_salary= ? , worker_monthly_deposit=? where worker_id = ? ').run(wk_name , wk_salary , wk_monthly_deposit,wk_id);
    res.code(203);
    return {updated : info.changes};

});

//listner on port 3000 
fastify.listen({port : 3000}, (err , address) => {
    if(err ) {
        fastify.log.error(err);
        process.exit(1);
    }
}) 
