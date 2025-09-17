import dotenv from 'dotenv';
dotenv.config();

import { readFileSync } from 'fs';
import {connectPostgreSQL, query} from '../config/database.js';
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');

    await connectPostgreSQL();
    
    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await query(schema);
    console.log('✅ Database schema created successfully');
    
    // Test query to verify tables exist
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📊 Created tables:', result.rows.map(row => row.table_name));
    
    console.log('🎉 Database initialization complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initializeDatabase();