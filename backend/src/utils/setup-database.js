// Database Setup Script for CoFund Personal Finance App
// This script generates the complete SQL for manual execution in Supabase

const { generateAllSchemaSQL } = require('./database');
const fs = require('fs').promises;
const path = require('path');

async function generateSetupSQL() {
  try {
    console.log('🔄 Generating complete database setup SQL...');
    
    const sql = generateAllSchemaSQL();
    
    // Write to file
    const outputPath = path.join(__dirname, '../../database-setup.sql');
    await fs.writeFile(outputPath, sql);
    
    console.log('✅ Complete database setup SQL generated!');
    console.log(`📁 File: ${outputPath}`);
    console.log('\n📋 Next steps:');
    console.log('1. Copy the contents of database-setup.sql');
    console.log('2. Go to your Supabase dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Paste and execute the SQL');
    console.log('\n💡 This will create all tables, indexes, and RLS policies for your CoFund app.');
    
    return outputPath;
  } catch (error) {
    console.error('❌ Failed to generate setup SQL:', error);
    throw error;
  }
}

// CLI command
async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'generate':
        await generateSetupSQL();
        break;
      
      default:
        console.log('📋 Database Setup Commands:');
        console.log('  generate  - Generate complete database setup SQL');
        console.log('\nUsage:');
        console.log('  node setup-database.js generate');
        break;
    }
  } catch (error) {
    console.error('❌ CLI command failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = {
  generateSetupSQL
};

// Run CLI if called directly
if (require.main === module) {
  runCLI();
} 