import dotenv from 'dotenv';
import { bootstrapAdminUser } from './auth.js';
import { loadConfig } from './config.js';
import { openDatabase } from './database.js';

dotenv.config();

const config = loadConfig();

if (!config.adminBootstrapName || !config.adminBootstrapEmail || !config.adminBootstrapPassword) {
  throw new Error('ADMIN_BOOTSTRAP_NAME, ADMIN_BOOTSTRAP_EMAIL, and ADMIN_BOOTSTRAP_PASSWORD must be set before running the admin bootstrap command.');
}

const db = openDatabase(config.databasePath);
const result = bootstrapAdminUser(db, {
  name: config.adminBootstrapName,
  email: config.adminBootstrapEmail,
  password: config.adminBootstrapPassword,
});
db.close();

console.log(result.created
  ? `Created admin account for ${result.user.email}`
  : `Admin account already exists for ${result.user.email}`);
