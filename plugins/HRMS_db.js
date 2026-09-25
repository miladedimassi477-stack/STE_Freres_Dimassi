const fp = require('fastify-plugin'); // this widens the plugins scoop of view to include the entire app 
const Database = require('better-sqlite3'); //importing sqlite3 

async function dbPlugin(fastify, options) {
  const db = new Database('HRMS.db'); // the path.join creats this path /home/you/hrms/plugins/HRMS.db , and the new part makes sure to create the database if it doesn't originally exit and if it does then it simply opens it 

  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      worker_id              INTEGER PRIMARY KEY ,
      worker_name            TEXT NOT NULL,
      worker_salary          REAL,
      worker_monthly_deposit REAL
    );

    CREATE TABLE IF NOT EXISTS payroll (
      payroll_id    INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id     INTEGER NOT NULL,
      pay_month     TEXT NOT NULL,          -- e.g. '2026-09'
      to_pay_worker REAL DEFAULT 0,
      worker_owes   REAL DEFAULT 0,
      bonus         REAL DEFAULT 0,
      FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      attendance_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id       INTEGER NOT NULL,
      work_days       REAL NOT NULL,       
      days_worked     TEXT NOT NULL, 
      extra_hours     REAL DEFAULT 0,
      FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE
    );
  `);
  fastify.decorate('hrms_db', db); // this is a decorating that lets us acces the database and talk to it via fastify.db 

  fastify.addHook('onClose', (instance, done) => { 
    db.close();
    done();
  }); // this tells sqlite to run this function before the server shutsdown, the funstion closes the database connection and 'done()' marks the end of the clean up it is necessary for sqlite to end the connection
  console.log('HRMS DB is ready ! ');
}

module.exports = fp(dbPlugin);