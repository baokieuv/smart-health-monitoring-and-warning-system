// Test file database.js config
const connectDB = require('../config/database');
const mongoose = require('mongoose');

async function test() {
  try {
    console.log('Testing database.js config...\n');
    
    
    await connectDB();

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n✅ Can query database! Found', collections.length, 'collections\n');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
