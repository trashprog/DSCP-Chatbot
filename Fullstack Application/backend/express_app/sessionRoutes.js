const express = require('express');
const pool = require('./db');
const { getUserIdByUsername } = require('./utils');
const { verifyToken }  = require('./userRoutes');
let sessionRoutes = express.Router();


// get user sessions
sessionRoutes.get('/sessions', verifyToken, async (req, res) => {
  const username = req.query.username;
  try {
    const userid = await getUserIdByUsername(username);
    if (!userid) return res.status(404).json({ message: 'User not found' });

    const sessionsResult = await pool.query(
      'SELECT sessionid, sessiontopic, datecreated FROM chatSessions WHERE userid = $1 ORDER BY datecreated DESC',
      [userid]
    );

    res.json({ sessions: sessionsResult.rows });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// create session
sessionRoutes.post('/sessions', async (req, res) => {
  const { username, sessiontopic } = req.body;

  const userid = await getUserIdByUsername(username);
  if (!userid) return res.status(404).json({ message: 'User not found' });

  const result = await pool.query(
    'INSERT INTO chatSessions (userid, sessiontopic) VALUES ($1, $2) RETURNING sessionid, sessiontopic, datecreated',
    [userid, sessiontopic || null]
  );

  res.status(201).json({ message: 'Session created', session: result.rows[0] });
});

// update the session
sessionRoutes.patch('/sessions/:sessionid', verifyToken, async (req, res) => {
  const { sessionid } = req.params; //params is basically the /:sessionid part of the URL
  const { sessiontopic } = req.body;

  if (!sessiontopic) {
    return res.status(400).json({ message: 'Missing session topic in request body' });
  }

  try {
    const result = await pool.query(
      'UPDATE chatSessions SET sessiontopic = $1 WHERE sessionid = $2 RETURNING sessionid, sessiontopic, datecreated',
      [sessiontopic, sessionid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.status(200).json({
      message: 'Session topic updated successfully',
      session: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




// delete session
sessionRoutes.delete('/sessions/:sessionid',verifyToken,  async (req, res) => {
  const { sessionid } = req.params;

  // check if sessionid valid
  if (!sessionid) {
    return res.status(400).json({ message: 'Missing session ID' });
  }

  try {
    // Attempt to delete the session
    const result = await pool.query(
      'DELETE FROM chatSessions WHERE sessionid = $1 RETURNING *',
      [sessionid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.status(200).json({
      message: 'Session deleted successfully',
      session: result.rows[0],
    });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = sessionRoutes;
