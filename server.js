const Fastify = require('fastify');
const dbPlugin = require('./plugins/HRMS_db.js');
const inOutLogsPlugins = require('./plugins/vehicule_logs.js');
const spendingLogsPlugins = require('./plugins/spending_logs.js');
const monthly_logs_plugin = require('./plugins/monthly_logs_db.js');
const yearly_logs_plugins = require('./plugins/yearly_logs.js');
const { default: System } = require('typebox/system');
const fastify = Fastify({logger : true });

fastify.register(dbPlugin);
fastify.register(inOutLogsPlugins);
fastify.register(spendingLogsPlugins);
fastify.register(monthly_logs_plugin);
fastify.register(yearly_logs_plugins);
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
    fastify.hrms_db.prepare('insert into attandence (worker_id,number_of_days_worked,days_worked,extra_hours) VALUES (?,?,?,?)').run(wk_id,0,"0",0);
    fastify.hrms_db.prepare('insert into payroll (worker_id , to_pay_the_worker,bonuse,money_given_this_week_before_pay_day) values (?,?,?,?)').run(wk_id , 0 , 0,0.0); 
    res.code(201);
    return {worker_id : info.lastInsertRowid};
});
//search worker 
fastify.get('/hrms/worker/:wk_id' , async(req , res ) => {
    const info =  fastify.hrms_db.prepare('select * from workers where worker_id = ? ').get(req.params.wk_id) ; 
    if (info == undefined ) { 
        res.code(500);
    }
    res.code(210);
})
//delete worker 
fastify.delete('/hrms/worker/:wk_id' , async (req  , res) => {
    const info = fastify.hrms_db.prepare('delete from workers where worker_id = ? ' ).run(req.params.wk_id);
    fastify.hrms_db/prepare('delete from attandence where worker_id = ? ').run(req.params.wk_id);
    fastify.hrms_db/prepare('delete from payroll where worker_id = ? ').run(req.params.wk_id);

    if(info.changes === 0 ){
        res.code(404);
    }
    res.code(202);
    return {deleted : info.changes }; 
})
//modifier worker 
fastify.put('/hrms/worker', async (req , res ) => {
    const {wk_id , wk_name , wk_salary , wk_monthly_deposit} = req.body;
    const info = fastify.hrms_db.prepare('update workers set worker_name = ? AND worker_salary= ? AND worker_monthly_deposit=? where worker_id = ? ').run(wk_name , wk_salary , wk_monthly_deposit,wk_id);
    if (info.changes === 0 ) { 
        res.code(404);
    }
    res.code(204);
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
        fastify.hrms_db.prepare('update attandence SET number_of_days_worked = ? , extra_hours = ?  , days_worked = ? where worker_id = ? ').run(0,0,"0",element.worker_id);
    });

    rep.code(204); // this is a code for everything going well 

})
//route end_cycle : this route marks the end of the week and it aims to collect the weeks data and send it to a logging database
fastify.get('/hrms/end_cycle' , async(req ,  rep ) =>{
    //money data : the data we will be collecting are the money out (meanning how much money was spent on wages) and how much money was handed before pay day this week 
    //extracting the data :
    //results to show and log into monthly_logs_db
    const sum_wages = fastify.hrms_db.prepare('select sum(to_pay_the_worker) as res from payroll ').get().res; //this return the sum of wages to pay based on attandence 
    //results to show then never remmember :
    const sum_money_given_before_pay_day = fastify.hrms_db.prepare('select sum(money_given_this_week_before_pay_day) as res from payroll').get().res; // this returns the sum of money_given_this_week_before_pay_day it will be shown at the end of the week 
    const expected_money_from_vehicules_out = fastify.in_out_logs_db.prepare('select sum(price) as res from OUT O , vehicul V , types T where O.vehicul_id = V.vehicul_id and V.type_id = T.type_id ').get().res;
    //logging the data : 
    const info = fastify.monthly_logs_db.prepare('insert into wages (amount_given) VALUES ( ? ) ').run(sum_wages);

    //attandence data : 

    //extracting 

    //here we will extract the days worked whcih will look like "130323" that translates to the worker was present at the first shift at monday, the second day he worked his full shift ect .. 
    //and we will summ out these numbers (for each respective day) and translate it into the its respective letter in the alphabet for exemple the worker worked 4 full shift mondays this month so 3+3+3+3 = 12 , 12 in the alphabet will give F or something and yeah that will lokk like this FFADCD then from we can calculate the persentage of attandance of the worker for each day of the week base on the rang of the alphabet on the given day , for exemple : for momday hehas an F that means he has a 100% percentage of showing up to work in mondays , friday he has a D mean he has 30% of showing up at friday's and so on 
    // we will use a fonction and give the monthly logs attandence ("ABCSDD") and the weekly attandence ("321232") then it will generate the new monthly attandence and log it back into the monthly logs database .
    const list_workers = fastify.hrms_db.prepare('select worker_id as id , days_worked as days_worked from attendance ').all();
    list_workers.forEach(element , async function calculate_and_log_new_monthly_attendance(elementid) {
        const monthly_days_worked = fastify.monthly_logs_db.prepare('select days_worked from attandandence_logs where worker_id = ?  ').run(element.id).get();
        //now we calculate the new attandance value 
        const new_attandence = "";
        for (let i = 0; i < 6; i++) {
                new_attandence += ?;
            
        }
        //logging 
        const info = fastify.monthly_logs_db.prepare('update attandence_logs SET days_worked = ? where worker_id = ? ').run(new_attandence, element.id );
        if(info.changes === 0 ){
            console.log('issues aaccured in the new attandence calculations ');
        }
        console.log('new attandence calculations jawha bahy ');

    })


} )
//when a check or a repaire gets done it will get logged directly into the monthly_logs 
fastify.post('/money_in',async (req , rep ) => {
    const {amount , type, log_date } = req.body ;
    const info = fastify.monthly_logs_db.prepare('insert into money_in (type, amount , date ) VALUES  (?,?,?)').run(type , amount, log_date);
    rep.code(210);
    return {created : info.lastInsertRowid
    };
} )
//CRUD spending logs: 
//adding an item
fastify.post('/spending/log_item' , async (rep , req ) => { 
    const {item_chef_name , amount} = req.body;
    const info = fastify.spending_logs_db.prepare('insert into logs (item_name , chef_name , amount ) VALUES (? , ? , ? ) ' ).run(item_name , chef_name , amount);
    return {inserted : info.lastInsertRowid};

})
//removing an item 
fastify.delete('/spendings/remove_log' , async (rep , req ) => {
    const [log_id] = req.body 
    const info = fastify.spending_logs.prepare('delete from logs where log_id = ? ').run(log_id);
    return {deleted : info.changes};

})
//searching an item based on log_id 
fastify.get('/spending/search_item' , async(req , rep ) => { 
    const {log_id} = req.body ; 
    const info = fastify.spending_logs_db.prepare('select item_name as name , amount as price from logs where log_id = ? ' ).run(log.id);
})
//spendin_logs will also have weekly cycle 
//start cycle routes
fastify.put('/spending/start_cycle' , async (rep , req ) =>  { 
    //simply delete everything in the database 
    const info = fastify.spending_logs.prepare('delete * from logs'); 
}) 
//end cycle routes: 
fastify.put('/spending/end_cycle' , async (req , rep ) => { 
    //extract data from spending_logs 
    const chefs_total_spendings = fastify.spending_logs_db.prepare('select chef_name as name , sum(amount) as total_spending from logs group by chef_name ').all();
    chefs_total_spendings.forEach(element , async function (element ) {
        fastify.monthly_logs_db.prepare('insert into items_logs (chefs_name , amount ) VALUES (? , ? ) ').run(element.name , element.total.spending);
        
    })  
    rep.code(240);

})
