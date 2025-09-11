import { Pool } from 'pg';
let pool;

export const connectPostgreSQL = async()=>{
    try{
        pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: String(process.env.DB_PASSWORD),
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        const client=await pool.connect();
        console.log('✅ PostgreSQL connected successfully');
        client.release();
        
        return pool;
    } catch (error){
        console.error("Failed to connect to PGsql:", error);
        throw error;
    }
}

export const query =(text, params) =>{
    return pool.query(text, params);
}

export const getPool = () => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Call connectPostgreSQL() first.');
  }
  return pool;
};
