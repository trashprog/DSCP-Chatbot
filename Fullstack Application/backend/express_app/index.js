const { ensureBucketExists } = require('./s3Client');
const express = require('express');
const cors = require('cors');
// const bcrypt = require('./node_modules/bcryptjs/umd');
const pool = require('./db');
const users = require('./userRoutes')
const sessions = require('./sessionRoutes')
const messages = require('./messageRoutes')


// require('dotenv').config({path: "../../Multi-modal Chatbot to Explain Live Sensor Data and Images/.env"});

require('dotenv').config({path: "../../../.env"});
console.log('DB Host:', process.env.DATABASE);

// setup app
const PORT = 2500;
const app = express();

app.use(cors());
app.use(express.json());
app.use(users);
app.use(sessions);
app.use(messages);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    ensureBucketExists();
});


// check if connection successful
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB connection failed:', err);
  } else {
    console.log('DB connected at:', res.rows[0].now);
  }
});
