const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

console.log('🔍 MongoDB Connection Diagnostic Test');
console.log('=====================================\n');

// Display connection details (without exposing password fully)
const mongoUri = process.env.MONGO_URI;
console.log('✓ Connection String Loaded');
console.log(`  MongoDB URI (masked): mongodb+srv://MAwaisIshaq:****@${mongoUri.split('@')[1]}`);
console.log(`  Port: ${process.env.PORT || 5000}\n`);

// Test connection with timeout
console.log('⏳ Attempting to connect to MongoDB Atlas...\n');

const connectionOptions = {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 5000,
};

mongoose
  .connect(mongoUri, connectionOptions)
  .then(async () => {
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!\n');
    console.log('Database Details:');
    console.log(`  - Connection Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    console.log(`  - Database Name: ${mongoose.connection.name}`);
    console.log(`  - Host: ${mongoose.connection.host}`);
    console.log(`  - Port: ${mongoose.connection.port}`);
    
    // List existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`  - Collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None'}\n`);
    
    await mongoose.connection.close();
    console.log('✓ Connection closed gracefully');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ FAILED: Could not connect to MongoDB Atlas\n');
    console.log('Error Details:');
    console.log(`  - Code: ${err.code}`);
    console.log(`  - Message: ${err.message}\n`);
    
    console.log('🔧 Troubleshooting Steps:');
    console.log('1. Check your network/firewall - DNS to MongoDB is blocked');
    console.log('2. Verify MongoDB Atlas Network Access:');
    console.log('   - Go to MongoDB Atlas Dashboard > Network Access');
    console.log('   - Add your current IP address: 0.0.0.0/0 (allows all)');
    console.log('3. Verify credentials in .env file');
    console.log('4. Check if you\'re behind a corporate proxy/VPN');
    console.log('5. Try connecting from a different network (mobile hotspot)\n');
    
    process.exit(1);
  });
