const { Pool } = require('pg');
// require('dotenv').config({path: "../../Multi-modal Chatbot to Explain Live Sensor Data and Images/.env"});
require('dotenv').config({path: "../../../.env"});

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: Number(process.env.PORT), // Ensure port is a number
});

// let database;

module.exports = pool
