import { migrate, pool } from './db.js'

migrate().then(()=>{ console.log('DayFlow PostgreSQL schema is ready') }).catch(error=>{ console.error(error);process.exitCode=1 }).finally(()=>pool.end())
