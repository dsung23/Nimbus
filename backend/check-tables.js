// Check if required tables exist in Supabase
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('💡 Make sure your .env file has:');
  console.log('   SUPABASE_URL=your_supabase_url');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to check
const requiredTables = [
  'users',
  'accounts', 
  'transactions',
  'schema_migrations'
];

async function checkTables() {
  console.log('🔍 Checking if required tables exist...\n');

  for (const tableName of requiredTables) {
    try {
      // Try to select from the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table '${tableName}' does NOT exist`);
        } else {
          console.log(`⚠️  Table '${tableName}' exists but has an error: ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${tableName}' exists`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}': ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('===========');
  
  // Get all tables in the database
  try {
    const { data: tables, error } = await supabase
      .rpc('get_all_tables');
    
    if (error) {
      console.log('Could not get all tables list');
    } else {
      console.log('All tables in database:');
      console.log(tables);
    }
  } catch (err) {
    console.log('Could not retrieve all tables');
  }
}

// Run the check
checkTables().catch(console.error); 