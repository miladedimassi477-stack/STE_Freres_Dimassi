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

//add worker also take care of the case of a worker gettting added mid week (each time a worker gets added we add an attendace row and a payroll row)

fastify.post('/hrms/worker' , async (req , res ) =>{
    const {wk_id , wk_name , wk_salary , wk_monthly_deposit} = req.body;
    const info = fastify.hrms_db.prepare('insert into workers (worker_id , worker_name , worker_salary , worker_monthly_deposit,worker_owes ) VALUES (?,?,?,?,?)').run(wk_id , wk_name , wk_salary , wk_monthly_deposit,0);
    fastify.hrms_db.prepare('insert into attandence (worker_id,number_of_days_woked,days_worked,extra_hours) VALUES (?,?,?,?)').run(wk_id,0,"0",0);
    fastify.hrms_db.prepare('insert into payroll (worker_id , to_pay_the_worker,bonuse,money_given_this_week_before_pay_day) values (?,?,?,?)').run(wek_id , 0 , 0,0.0);ttandence_id, 
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
    return {deleted : info.changes }; 
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
//CRUD ROUTES FOR PAYROLL 

//this table aimes to have one row for each worker and gets updated everythime a attendance is loged then delivers final payroll amount at the edn eof the week , sends the data to another logging database then resets 
/*
the plan : 
attendance and payroll will have a weekly cycle : 
-each week we will create rows for every existing worker and track their attendacne and payroll based on attendance 
-at the end of the week we will send analytical data to a logging database that will have a monthly cyle and then delete all existing rows and start over again (that should keep rows at a minimum to not make the application too heavy)
*/ 
//ROUTES
//this is a route that will get executed at the start of a new week, it will creat rows for payrolland attandance for all existing workers 
fastify.put('/hrms/start_cycle' , async (req , rep) =>{ 
    // for each worker create a row in payroll:
    //first extract all worker id's and put them in a table 
    const workers  = fastify.hrms_db.prepare('select worker_id from workers ').all();
    //parse the id's and restart the paayroll and bonuses 
    workers.forEach(element => {
        fastify.hrms_db.prepare('update payroll set to_pay_the_worker = ? AND bonuse = ? AND money_given_this_week_before_pay_day = ? where worker_id=?').run(0,0,0.0,element.worker_id);
        fastify.hrms_db.prepare('update attandence SET number_of_days_worked = ? , extra_hours = ?  , days_worked = ? ').run(0,0,"0");
    });

    rep.code(204); // this is a code for everything going well 

})
//route end_cycle : this route marks the end of the week and it aims to collect the weeks data and send it to a logging database
fastify.get('/hrms/end_cycle' , async(req ,  rep ) =>{
    //money data : the data we will be collecting are the money out (meanning how much money was spent on wages) and how much money was handed before pay day this week 
    //extracting the data :
    const sum_wages = fastify.hrms_db.prepare('select sum(to_pay_the_worker) as res from payroll ').get().res; //this return the sum of wages to pay based on attandence ; 
    const sum_money_given_before_pay_day = fastify.hrms_db.prepare('select sum(money_given_this_week_before_pay_day) as res from payroll').get().res; // this returns the sum of money_given_this_week_before_pay_day
    //logging the data : 

    //attandence data : 
    //extracting 
    
    //logging 

} ) 