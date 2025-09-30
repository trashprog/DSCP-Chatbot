import axios from 'axios';
// npm install @microsoft/fetch-event-source recharts
// npm install fetch
import { useState, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const URL = "http://127.0.0.1:8000"
const DB_URL = "http://localhost:2500"

export async function registerUser(formData) {
  return await axios.post(`${DB_URL}/register`, formData);
}

export async function loginUser(username, password) {
  return await axios.post(`${DB_URL}/login`, { username, password });
}

// Sessions
export async function getSessions(username){
  if (!username) {
    throw new Error('Username is required');
  }

  try {
    const response = await axios.get(`${DB_URL}/sessions`, {
      params: { username }
    });

    return response.data.sessions;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw error;
  }
}

// creating sesh
export async function createSession(username, sessiontopic = null) {
  try {
    const response = await axios.post(`${DB_URL}/sessions`, {
      username,
      sessiontopic,
    });

    return response.data; // Contains message and session info
  } catch (error) {
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error('Error:', error.response.data);
      return { error: error.response.data.message };
    } else if (error.request) {
      // No response received from server
      console.error('No response received:', error.request);
      return { error: 'No response from server' };
    } else {
      // Something else happened
      console.error('Request error:', error.message);
      return { error: 'Unexpected error occurred' };
    }
  }
}

// delete session, duh
export async function deleteSession(sessionid) {
  try {
    const response = await axios.delete(`${DB_URL}/sessions/${sessionid}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data);
      return { error: error.response.data.message };
    } else if (error.request) {
      console.error('No response received:', error.request);
      return { error: 'No response from server' };
    } else {
      console.error('Request error:', error.message);
      return { error: 'Unexpected error occurred' };
    }
  }
}

// update session topic
export async function editSessionTopic(sessionid, newTopic) {

  try{
    const response = await axios.patch(`${DB_URL}/sessions/${sessionid}`, {
      sessiontopic: newTopic
    });
    console.log('Updated session:', response.data);
    return response.data; // Contains updated session info

  }catch (error){
    console.error('Error updating session:', error.response?.data || error.message);
    return error.response?.data || { error: 'Failed to update session' };
  }

}


export async function verifyUser(user) {
  const response = await axios.post(`${DB_URL}/login`, user);
  if (response.data.success){
    return response.data.token;
  } else {
    return;
  }
}


// for chatbot
export async function streamAnswer(query, sessionid, imageUrl = null) {
  if (!sessionid) {
    throw new Error("sessionid is required for chat");
  }

  let requestUrl = `${URL}/chatbot/ragRoute?query=${encodeURIComponent(query)}&sessionid=${encodeURIComponent(sessionid)}`;
  if (imageUrl) {
    requestUrl += `&image_url=${encodeURIComponent(imageUrl)}`;
  }

  const response = await fetch(requestUrl);
  return response;
}

export async function terminateStream(streamId) {
  try {
    // The payload must match the Pydantic model on the backend
    const response = await axios.post(`${URL}/chatbot/terminate`, {
      stream_id: streamId,
    });
    console.log('Stream termination signal sent:', response.data);
    return response.data;
  } catch (error) {
    // It's okay if this fails (e.g., stream already ended), so we just log it.
    console.error('Error sending termination signal:', error.response?.data || error.message);
  }
}

// creating a new topic title
export async function generateTopic(response){
    const prompt = `Based on the response: ${response}, generate a topic in 4–5 words. Return only the topic without any explanation or extra text.`;
    const topic = await fetch(
        `${URL}/chatbot/topic?query=${encodeURIComponent(prompt)}`
    );
    return topic

}

// initilaising memory for existing chat sessions
export async function reloadMemory(userid){
  const response = await axios.post(`${URL}/chatbot/reload-memory`, {userid})
  return response.data.status

}

// delete the chat engine with corresponding sessionid
export async function deleteSessionMemory(sessionid){
  try{
      const response = axios.delete(`${URL}/chatbot/session/${sessionid}`)
      console.log(response);
  }catch (error){
    console.error('Error deleting session memory:', error.response?.data || error.message);
  }
    
}


// MESSAGES

// if sessionid is unique even across all users i just need the session id
export async function getMessages(sessionid){
  const response = await axios.get(`${DB_URL}/messages`, {
    params: {sessionid}
  });

  // Now in format: [{ role: 'user', content: 'Hi' }, ...] you dont need format in the front end now can jus directly replace 
  return response.data.messages;
}

// this is for creating messages
export async function createMessage({ sessionid, sender, content, reply_to = null, imageFile = null }) {
  try {
    // FormData is required for file uploads
    const formData = new FormData();
    formData.append('sessionid', sessionid);
    formData.append('sender', sender);
    formData.append('content', content); // This is the text prompt or caption
    if (reply_to) {
      formData.append('reply_to', reply_to);
    }
    if (imageFile) {
      // The key 'image' MUST match the one used in the multer middleware on the backend
      formData.append('image', imageFile); 
    }

    // Axios will automatically set the 'Content-Type' to 'multipart/form-data'
    const response = await axios.post(`${DB_URL}/messages`, formData);

    console.log('Created message:', response.data);
    return response.data; // The backend now returns a consistently formatted message object

  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

// updating messages will be done another time stay tuned!


// // Image upload for segmentation
// export const sendImage = async (formData) => {
//   return await axios.post(`${URL}/segment/`, formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });
// };
