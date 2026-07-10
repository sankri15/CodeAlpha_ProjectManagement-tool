import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';

async function check() {
  const db = await open({
    filename: path.join(__dirname, '..', 'database.sqlite'),
    driver: sqlite3.Database
  });

  const user = await db.get('SELECT * FROM users WHERE email = ?', ['demo@example.com']);
  if (!user) {
    console.log('USER NOT FOUND!');
    return;
  }
  console.log('User found:', user.email);
  const match = await bcrypt.compare('password', user.password);
  console.log('Password match:', match);
}

check().catch(console.error);
