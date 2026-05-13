const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

console.log('\n🔐 RAILWAY MONGODB AUTH DEBUG\n');
console.log('='.repeat(60));

const mongoUri = process.env.MONGO_URI;

// Parse the connection string
const uriMatch = mongoUri.match(/mongodb:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (uriMatch) {
  const [, user, pass, host, port, db] = uriMatch;
  console.log('✓ Connection String Parsed:');
  console.log(`  Username: ${user}`);
  console.log(`  Password: ${pass.substring(0, 5)}...${pass.substring(pass.length - 5)}`);
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Database: ${db}\n`);
}

// Test with minimal options first
console.log('📝 Attempting connection with minimal options...\n');

const minimalOptions = {
  serverSelectionTimeoutMS: 10000,
};

mongoose.connect(mongoUri, minimalOptions)
  .then(() => {
    console.log('✅ Connected with minimal options!');
    console.log('Connection state:', mongoose.connection.readyState);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Failed:', err.message);
    console.log('Error code:', err.code);
    
    console.log('\n📝 Attempting with Railway-specific options...\n');
    
    const railwayOptions = {
      authSource: 'admin',
      retryWrites: false,
      directConnection: true,
      serverSelectionTimeoutMS: 10000,
    };
    
    mongoose.connect(mongoUri, railwayOptions)
      .then(() => {
        console.log('✅ Connected with Railway options!');
        mongoose.connection.close();
        process.exit(0);
      })
      .catch(err2 => {
        console.log('❌ Failed:', err2.message);
        
        // Try without authSource
        console.log('\n📝 Attempting without authSource...\n');
        
        const noAuthSourceOptions = {
          retryWrites: false,
          directConnection: true,
          serverSelectionTimeoutMS: 10000,
        };
        
        mongoose.connect(mongoUri, noAuthSourceOptions)
          .then(() => {
            console.log('✅ Connected without authSource!');
            mongoose.connection.close();
            process.exit(0);
          })
          .catch(err3 => {
            console.log('❌ Failed:', err3.message);
            console.log('\n⚠️  SOLUTIONS:');
            console.log('1. Verify Railway MongoDB credentials in dashboard');
            console.log('2. Copy fresh connection string from Railway UI');
            console.log('3. Check if password has special characters');
            console.log('4. Try using Railway internal network URL');
            process.exit(1);
          });
      });
  });
