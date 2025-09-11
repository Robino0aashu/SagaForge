require('dotenv').config();

import { readFileSync } from 'fs';
import { join } from 'path';
import {connectPostgreSQL, query} from '../config/database.js';

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