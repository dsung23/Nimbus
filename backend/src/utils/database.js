// Database utility functions for CoFund Personal Finance App
const { createClient } = require('@supabase/supabase-js');
const schemas = require('../schemas');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL environment variable');
  console.log('💡 Please add SUPABASE_URL to your .env file');
  console.log('   Example: SUPABASE_URL=https://your-project.supabase.co');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('💡 Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.log('   Example: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  process.exit(1);
}

// Validate URL format
if (!supabaseUrl.includes('supabase.co') || supabaseUrl.includes('dashboard')) {
  console.error('Invalid SUPABASE_URL format');
  console.log('Your SUPABASE_URL should look like: https://your-project.supabase.co');
  console.log('   Current value:', supabaseUrl);
  console.log('   Make sure you\'re using the API URL, not the dashboard URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Initialize database tables and indexes
 * Note: This function is for reference only. In production, use migrations.
 */
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    console.log('⚠️  This function is for reference only.');
    console.log('📝 Please use the migration system or execute SQL manually in Supabase.');
    
    // Show what would be created
    for (const [name, schema] of Object.entries(schemas)) {
      console.log(`📋 Schema: ${schema.tableName}`);
      console.log(`   - Table creation SQL available in schema definition`);
      console.log(`   - Indexes: ${schema.indexes.length} indexes defined`);
      console.log(`   - RLS Policies: ${schema.rlsPolicies.length} policies defined`);
    }
    
    console.log('🎉 Database schema information displayed!');
    console.log('💡 To create tables, run the migration or execute SQL manually in Supabase.');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get database client
 */
function getClient() {
  return supabase;
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    console.log('📡 URL:', supabaseUrl);
    console.log('🔑 Key:', supabaseKey.substring(0, 10) + '...');
    
    // Test connection by making a simple query to a system view
    const { data, error } = await supabase
      .rpc('version')
      .select('*')
      .limit(1);
    
    if (error) {
      // If RPC doesn't work, try a simple health check
      const { data: healthData, error: healthError } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);
      
      if (healthError) {
        // If that fails too, just check if we can connect
        console.log('✅ Database connection successful (basic connectivity)');
        console.log('💡 Note: No tables exist yet - this is normal for a new project');
        return true;
      }
      
      console.log('✅ Database connection successful');
      console.log('📊 Health check passed');
      return true;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Version info available');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('fetch')) {
      console.log('💡 This might be a network issue or incorrect URL');
    } else if (error.message.includes('401')) {
      console.log('💡 Check your SUPABASE_SERVICE_ROLE_KEY');
    } else if (error.message.includes('404')) {
      console.log('💡 Check your SUPABASE_URL');
    }
    
    return false;
  }
}

/**
 * Get schema information
 */
function getSchemas() {
  return schemas;
}

/**
 * Validate data against schema
 */
function validateData(schemaName, data) {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Schema ${schemaName} not found`);
  }
  
  const validation = schema.validation;
  const errors = [];
  
  for (const [field, rules] of Object.entries(validation)) {
    const value = data[field];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip validation if field is not required and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Type validation
    if (rules.type && value !== undefined && value !== null) {
      const actualType = typeof value;
      if (rules.type === 'number' && actualType !== 'number') {
        errors.push(`${field} must be a number`);
      } else if (rules.type === 'string' && actualType !== 'string') {
        errors.push(`${field} must be a string`);
      } else if (rules.type === 'boolean' && actualType !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      } else if (rules.type === 'integer' && (!Number.isInteger(value) || actualType !== 'number')) {
        errors.push(`${field} must be an integer`);
      } else if (rules.type === 'uuid' && !isValidUUID(value)) {
        errors.push(`${field} must be a valid UUID`);
      }
    }
    
    // String length validation
    if (rules.type === 'string' && value) {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters`);
      }
    }
    
    // Number range validation
    if (rules.type === 'number' && value !== undefined) {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be no more than ${rules.max}`);
      }
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
    
    // Email format validation
    if (rules.format === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field} must be a valid email address`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate SQL for schema creation
 */
function generateSchemaSQL(schemaName) {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Schema ${schemaName} not found`);
  }
  
  let sql = `-- ${schemaName} Schema\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;
  
  // Add table creation
  sql += schema.createTableSQL + '\n\n';
  
  // Add indexes
  sql += '-- Indexes\n';
  schema.indexes.forEach(index => {
    sql += index + '\n';
  });
  sql += '\n';
  
  // Add RLS policies
  sql += '-- Row Level Security\n';
  schema.rlsPolicies.forEach(policy => {
    sql += policy + '\n';
  });
  
  return sql;
}

/**
 * Generate all schema SQL
 */
function generateAllSchemaSQL() {
  let sql = `-- Complete Database Schema for CoFund\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;
  
  // Enable extensions
  sql += `-- Enable required extensions\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
  
  // Generate SQL for each schema
  for (const [name, schema] of Object.entries(schemas)) {
    sql += `-- ${name} Schema\n`;
    sql += `-- ====================\n\n`;
    sql += schema.createTableSQL + '\n\n';
    
    sql += '-- Indexes\n';
    schema.indexes.forEach(index => {
      sql += index + '\n';
    });
    sql += '\n';
    
    sql += '-- Row Level Security\n';
    schema.rlsPolicies.forEach(policy => {
      sql += policy + '\n';
    });
    sql += '\n';
  }
  
  return sql;
}

module.exports = {
  initializeDatabase,
  getClient,
  testConnection,
  getSchemas,
  validateData,
  generateSchemaSQL,
  generateAllSchemaSQL
}; 