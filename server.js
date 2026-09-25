import Fastify from 'fastify';
import dbplugins from './plugins/HRMS_db.js';
import inOutLogsPlugins from './plugins/vehicule_logs.js';
import spendingLogsPlugins from '/plugins/spending_logs.js';
const fastify = Fastify({logger : true });

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
    fastify.hrms_db.prepare('insert into workers (worker_id , worker_name , worker_salary , worker_monthly_deposit ) VALUES (?,?,?,?)').run(wk_id , wk_name , wk_salary , wk_monthly_deposit)
    res.code(201);
    return {worker_id : info.lastInsertRowid};
});
//search worker 
fastify.get('/hrms/worker/:wk_id' , async(req , res ) => {
    return fastify.hrms_db.prepare('select * from workers where worker_id = ? ').get(req.params.wk_id) ; 
})
//delete worker 
fastify.delete('/hrms/worker/:id' , async (req  , res) => {
    fastify.hrms_db.prepare('delete from workers where worker_id = ? ' ).run(req.params.wk_id);
    res.code(202);
    return {ipdated : info.changes } ; 

})
//modifier worker 
fastify.put('/hrms/worker/ ', async (req , res ) => {
    const {wk_id , wk_name , wk_salary , wk_monthly_deposit} = req.body;
    fastify.hrms_db.prepare('update table workers set worker_id = ? , worker_name = ? , worker_salary= ? , worker_monthly_deposit=? where worker_id = ? ').run(wk_id , wk_name , wk_salary , wk_monthly_deposit,wk_id);
    res.code(203);

});

//listner on port 3000 
fastify.listen({port : 3000}, (err , address) => {
    if(err ) {
        fastify.log.error(err);
        process.exit(1);
    }
}) 
