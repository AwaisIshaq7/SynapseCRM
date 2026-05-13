const mongoose = require('mongoose');
const dotenv = require('dotenv');
const net = require('net');
const dns = require('dns').promises;

dotenv.config();

const mongoUri = process.env.MONGO_URI;
console.log('\n🔍 DATABASE CONNECTION DIAGNOSTIC\n');
console.log('=' .repeat(60));

// Parse URI
const urlParts = mongoUri.match(/mongodb:\/\/(.+):(.+)@(.+):(\d+)\/(.+)/);
if (urlParts) {
  console.log('✓ URI Format: Valid');
  const [, user, pass, host, port, db] = urlParts;
  console.log(`  - Host: ${host}`);
  console.log(`  - Port: ${port}`);
  console.log(`  - Database: ${db}`);
  console.log(`  - User: ${user}\n`);
  
  // Test DNS resolution
  console.log('🌐 DNS Test:');
  dns.resolve4(host)
    .then(addresses => {
      console.log(`  ✓ DNS resolved: ${host} -> ${addresses[0]}\n`);
      testConnection();
    })
    .catch(err => {
      console.log(`  ✗ DNS failed: ${err.message}\n`);
      console.log('⚠️  ISSUE: Cannot resolve MongoDB hostname');
      console.log('   Possible causes:');
      console.log('   - Network/firewall blocking DNS');
      console.log('   - No internet connection');
      console.log('   - Corporate proxy/VPN issue\n');
      process.exit(1);
    });
} else {
  console.log('✗ Invalid MongoDB URI format');
  process.exit(1);
}

function testConnection() {
  console.log('🔗 Connection Test:');
  console.log(`  Attempting connection to ${urlParts[3]}:${urlParts[4]}...\n`);
  
  const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  };
  
  mongoose.connect(mongoUri, connectionOptions)
    .then(() => {
      console.log('  ✓ Connected successfully!\n');
      console.log('✅ CONNECTION SUCCESSFUL\n');
      console.log('Connection Details:');
      console.log(`  - Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      console.log(`  - Database: ${mongoose.connection.name}`);
      console.log(`  - Host: ${mongoose.connection.host}`);
      mongoose.connection.close();
      process.exit(0);
    })
    .catch(err => {
      console.log(`  ✗ Connection failed: ${err.message}\n`);
      console.log('❌ CONNECTION FAILED\n');
      console.log('Error Code:', err.code || 'Unknown');
      console.log('Error Name:', err.name || 'Unknown\n');
      
      console.log('🔧 TROUBLESHOOTING:\n');
      if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
        console.log('→ DNS Resolution Failed');
        console.log('  - Check internet connection');
        console.log('  - Check firewall/proxy settings');
      } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ECONNRESET')) {
        console.log('→ Connection Refused/Reset');
        console.log('  - MongoDB service may not be running');
        console.log('  - Wrong host/port');
        console.log('  - Firewall blocking the port');
      } else if (err.message.includes('ETIMEDOUT') || err.message.includes('timeout')) {
        console.log('→ Connection Timeout');
        console.log('  - Check network connectivity');
        console.log('  - Railway service may be down');
        console.log('  - Try increasing timeout');
      } else if (err.message.includes('authentication failed')) {
        console.log('→ Authentication Failed');
        console.log('  - Invalid username/password');
        console.log('  - Check .env MONGO_URI');
      }
      console.log('');
      process.exit(1);
    });
}
