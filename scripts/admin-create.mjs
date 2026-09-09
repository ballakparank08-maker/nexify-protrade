import readline from 'node:readline';
import process from 'node:process';
import { userStore } from '../server/userStore.js';
import { normalizeEmail } from '../server/config.js';

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--email') {
      args.email = argv[i + 1];
      i += 1;
    }
  }
  return args;
};

const promptHidden = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // eslint-disable-next-line no-underscore-dangle
  rl._writeToOutput = () => {};

  const answer = await new Promise((resolve) => {
    rl.question(question, (value) => resolve(value));
  });

  rl.close();
  process.stdout.write('\n');
  return String(answer);
};

const run = async () => {
  const { email } = parseArgs(process.argv.slice(2));
  const cleanEmail = normalizeEmail(String(email || ''));

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    console.error('Usage: npm run admin:create -- --email <email>');
    process.exitCode = 1;
    return;
  }

  const password = await promptHidden('Admin password: ');
  const confirm = await promptHidden('Confirm password: ');

  if (password.length < 12) {
    console.error('Password must be at least 12 characters long.');
    process.exitCode = 1;
    return;
  }

  if (password !== confirm) {
    console.error('Passwords do not match.');
    process.exitCode = 1;
    return;
  }

  const user = await userStore.upsertAdmin({
    email: cleanEmail,
    name: 'Administrator',
    password
  });

  console.log(`Admin account prepared for ${user.email}.`);
};

run().catch((error) => {
  console.error('Failed to create admin account.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
