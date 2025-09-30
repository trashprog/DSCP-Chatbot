const express = require('express');
// const cors = require('cors');
const bcrypt = require('./node_modules/bcryptjs/umd');
const pool = require('./db');
const jwt = require("jsonwebtoken");
require('dotenv').config({path: "../../../.env"});

const saltRounds = 10;
let userRoutes = express.Router();


// verifications
function verifyToken(request, response, next){
    // console.log(request)
    const authHeaders = request.headers["authorization"]
    const token = authHeaders && authHeaders.split(" ")[1]
    if (!token){
        return response.status(401).json({message:"Auth token missing"})
    }
    jwt.verify(token, process.env.SECRET_KEY, (error, user)=>{
        if (error){
            return response.status(403).json({message:"Invalid token"})
        }

        request.user = user
        next()
    })
}

// create user
userRoutes.post('/register', async (req, res) => {
    const { username, password, email, role } = req.body;

        // not needed since the roles are defiend already
    //   const validRoles = ['admin', 'user'];
    //     if (!validRoles.includes(role)) {
    //     return res.status(400).json({ error: 'Invalid role' });
    //     }

    try {
        // debugging
        console.log('Register data:', { username, email, role }); 
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // create the new user
        const result = await pool.query(
        `INSERT INTO users (username, password, email, role) 
        VALUES ($1, $2, $3, $4) RETURNING *`,
        [username, hashedPassword, email, role]
        );
        // send success code
        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: error.message }); // send error to frontend
    }
});

// login
userRoutes.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        // Create a payload to sign - avoid sending password
        const payload = {
          userid: user.userid,
          username: user.username,
          email: user.email,
          role: user.role,
        };

        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' });

        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: payload, // send the sanitized user object back
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = userRoutes;
module.exports.verifyToken = verifyToken;