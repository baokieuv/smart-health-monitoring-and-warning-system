const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const app = require('./app');
const http = require('http');
const { initSocket } = require('./socket');

const PORT_BE = process.env.PORT_BE;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT_BE, () => {
  console.log(`🚀 Server is running on port ${PORT_BE}`);
  console.log(`🔌 Socket.io is ready for connections`);
});
