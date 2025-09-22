const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Replicate the logic from SessionStorage to find most recent session
const projectPath = process.cwd();
const projectHash = crypto.createHash('sha256').update(projectPath).digest('hex').substring(0, 12);

const sessionsDir = path.join(os.homedir(), '.edgar', 'sessions');
const indexPath = path.join(sessionsDir, 'index.json');

console.log('Debug: Finding most recent session for --continue flag\n');
console.log('Current project path:', projectPath);
console.log('Project hash:', projectHash);

if (fs.existsSync(indexPath)) {
  const index = fs.readJsonSync(indexPath);
  
  // Filter sessions for this project
  const projectSessions = index.sessions
    .filter(s => s.projectHash === projectHash)
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    
  console.log(`\nFound ${projectSessions.length} sessions for this project:`);
  
  projectSessions.slice(0, 3).forEach((session, i) => {
    console.log(`\n${i+1}. Session: ${session.id}`);
    console.log(`   Updated: ${session.updated}`);
    console.log(`   Messages: ${session.messageCount}`);
    console.log(`   Archived: ${session.archived || false}`);
    
    // Try to load the actual session
    const sessionFile = path.join(sessionsDir, 'active', `${session.id}.json`);
    if (fs.existsSync(sessionFile)) {
      const content = fs.readJsonSync(sessionFile);
      console.log(`   ✓ File exists with ${content.conversation.length} messages`);
      if (content.conversation.length > 0) {
        const lastMessage = content.conversation[content.conversation.length - 1];
        console.log(`   Last message: [${lastMessage.role}] ${lastMessage.content.substring(0, 50)}...`);
      }
    } else {
      console.log('   ✗ File not found in active directory');
    }
  });
  
  if (projectSessions.length === 0) {
    console.log('\nNo sessions found for this project path!');
    console.log('This would cause --continue to create a new session.');
  }
} else {
  console.log('\nIndex file does not exist!');
}