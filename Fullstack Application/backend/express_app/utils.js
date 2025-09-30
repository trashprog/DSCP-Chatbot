const pool = require('./db');

async function getUserIdByUsername(username) {
  const result = await pool.query('SELECT userid FROM users WHERE username = $1', [username]);
  return result.rows[0]?.userid || null;
}

module.exports = {
  getUserIdByUsername,
};
