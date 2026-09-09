import dotenv from 'dotenv';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './database.js';

dotenv.config();

const config = loadConfig();
const db = openDatabase(config.databasePath);
const app = createApp({ db, config });
const server = app.listen(config.port, () => {
  console.log(`Nexify ProTrade auth server listening on port ${config.port}`);
});

const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
