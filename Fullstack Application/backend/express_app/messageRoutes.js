const express = require('express');
const pool = require('./db');
const { verifyToken }  = require('./userRoutes');
const multer = require('multer');
const { minioClient } = require('./s3Client');
const path = require('path');
const { s3Client } = require('./s3Client');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config({path: "../../../.env"});

// router
let messageRoutes = express.Router();

// multer for in-memory file storage - staging area before moving to minio bucket
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const S3_BUCKET = process.env.AWS_S3_BUCKET;

// get messages
messageRoutes.get('/messages', verifyToken, async (req, res) => {
  const sessionid = req.query.sessionid;

  try {
    const messagesResult = await pool.query(
      'SELECT sender, content, message_type, caption FROM messages WHERE sessionid = $1 ORDER BY timestamp ASC;',
      [sessionid]
    );
  
    // Format messages based on their type
    const formattedMessages = messagesResult.rows.map(msg => {
      if (msg.message_type === 'image') {
        // The text is in the caption field The image URL is in the content field this is to handle when theres a text sent with an image
        return {role: msg.sender, text: msg.caption, image: msg.content,};
      }
      // default text message
      return {role: msg.sender,text: msg.content,image: null};
    });

    res.json({ messages: formattedMessages });

  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// create messages
messageRoutes.post('/messages', verifyToken, upload.single('image'), async (req, res) => {
    const { sessionid, sender, content } = req.body;
    const file = req.file;
    const userid = req.user.userid;

    if (!sessionid || !sender || !userid) {
        return res.status(400).json({ message: 'Missing required fields (sessionid, sender, userid)' });
    }
    if (!content && !file) {
        return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    let message_type = 'text';
    let dbContent = content;
    let caption = null;

    try {
        // --- If an image is uploaded ---
        if (file) {
            message_type = 'image';
            caption = content || null;

            const timestamp = Date.now();
            const objectName = `${userid}/sent_images/${timestamp}-${file.originalname}`;

            //  Upload to AWS S3 ---
            const uploadParams = {
                Bucket: S3_BUCKET,
                Key: objectName,      // The full path and filename for the object in S3
                Body: file.buffer,    // The file data
                ContentType: file.mimetype, // The file's MIME type
            };
            
            // Send the command to S3
            await s3Client.send(new PutObjectCommand(uploadParams));
            console.log(`Successfully uploaded ${objectName} to ${S3_BUCKET}`);

            // --- CHANGED: Construct the standard S3 URL ---
            // This creates the format: https://<bucket-name>.s3.<region>.amazonaws.com/<key>
            dbContent = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectName}`;
        }

        // --- Insert into PostgreSQL Database (no changes here) ---
        const result = await pool.query(
            `INSERT INTO messages (sessionid, sender, content, reply_to, message_type, caption)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING messageid, sender AS role, content AS text, timestamp, message_type, caption`,
            [sessionid, sender, dbContent, req.body.reply_to || null, message_type, caption]
        );

        // Format the response to be consistent (no changes here)
        const createdMessage = result.rows[0];
        const responseMessage = {
            messageid: createdMessage.messageid,
            role: createdMessage.role,
            text: createdMessage.message_type === 'image' ? createdMessage.caption : createdMessage.text,
            image: createdMessage.message_type === 'image' ? createdMessage.text : null,
            timestamp: createdMessage.timestamp,
        };

        res.status(201).json(responseMessage);

    } catch (err) {
        console.error('Error creating message:', err);
        res.status(500).json({ message: 'Server error while creating message' });
    }
});

module.exports = messageRoutes;



// update 
// im gonna leave this for another day

module.exports = messageRoutes;