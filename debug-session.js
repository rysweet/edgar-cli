const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Check if sessions are being saved
const configDir = path.join(os.homedir(), '.edgar');
const sessionsDir = path.join(configDir, 'sessions');
const indexPath = path.join(sessionsDir, 'index.json');

console.log('Checking Edgar session storage...\n');
console.log('Config directory:', configDir);
console.log('Sessions directory:', sessionsDir);
console.log('Index path:', indexPath);

if (fs.existsSync(sessionsDir)) {
  console.log('\n✓ Sessions directory exists');
  
  // Check active sessions
  const activeDir = path.join(sessionsDir, 'active');
  if (fs.existsSync(activeDir)) {
    const sessions = fs.readdirSync(activeDir);
    console.log(`\nActive sessions (${sessions.length}):`, sessions);
    
    // Show content of first session if exists
    if (sessions.length > 0) {
      const sessionFile = path.join(activeDir, sessions[0]);
      const content = fs.readJsonSync(sessionFile);
      console.log('\nFirst session preview:');
      console.log('- ID:', content.id);
      console.log('- Created:', content.created);
      console.log('- Messages:', content.conversation.length);
      console.log('- Project path:', content.projectPath);
      
      if (content.conversation.length > 0) {
        console.log('\nConversation entries:');
        content.conversation.forEach((msg, i) => {
          console.log(`  ${i+1}. [${msg.role}]: ${msg.content.substring(0, 100)}...`);
        });
      }
    }
  }
  
  // Check index
  if (fs.existsSync(indexPath)) {
    const index = fs.readJsonSync(indexPath);
    console.log('\nSession index:', index.sessions.length, 'sessions tracked');
  }
} else {
  console.log('\n✗ Sessions directory does not exist');
}