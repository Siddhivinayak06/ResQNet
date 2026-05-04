import http from 'http';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { initializeSocket } from './services/socket.js';
import { seedDemoData } from './services/seed.js';

async function startServer() {
  await connectDatabase();

  if (env.seedDemoData) {
    await seedDemoData();
  }

  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(env.port, () => {
    console.log(`[backend] API running on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('[backend] Failed to start server:', error);
  process.exit(1);
});
