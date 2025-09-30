# 🌱 DSCP Team 3 - Developer Code Standards in the Fullstack Application

## 📁 Project Folder Structure

This project follows a modular structure to keep frontend and backend logic separate and maintainable.

Fullstack application/\n\
├── backend/\n\
│ ├── routes.py/             # FastAPI route handlers\n\
│ ├── routes.js/            # Express.js Routes\n\
│ ├── models/          # Pydantic models/ SAM models (e.g. SQLAlchemy)\n\
│ ├── services/        # Business logic and reusable utilities\n\
│ ├── index.js             # Expressjs entry point this is where you start the Expressjs server\n\
│ ├── app.py          # FastAPI entry point this is where you start the FastAPI server\n\
│ ├── requirements.txt     # Backend dependencies\n\
│\n\
├── frontend/\n\
│   ├── public/              # Static assets\n\
│   ├── src/\n\
│   │   ├── components/      # Reusable React components this is where you put your components, you can add folders inside corresponding to your name to indicate who did what\n\
│   │   ├── api.jsx             # Frontend API functions (Axios/fetch wrappers)\n\
│   │   ├── hooks/           # Custom React hooks\n\
│   │   └── App.jsx          # Main React app\n\
│   └── package.json         # Frontend dependencies\n\
│\n\
├── .env                     # Environment variables use the dotenv library frm python and javascript (expected to learn yourself)\n\
├── docker-compose.yml       # Unified backend/frontend Docker config\n\
└── CODESTRUCTURE.md             # This file


## Routes and Apis
Here is how I want the routes to be formatted to ensure the code is clean and readable for everyone to understand

### FastAPI
If you want to create a new route in Fastapi, first think about whether is this route related to any of the current routes.py files, if not create a new one in the format of <topic_name>_routes.py
```bash
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/example",
    tags=["Example"]
)

@router.get("/hello")
async def say_hello():
    """
    Simple example route.
    """
    return {"message": "Hello, world!"}

```

### ExpressJs
Same applies to Express.js files but they should be formatted as <topicname>Routes.js or .ts
```bash
## ✅ Express Route Template

```js
// routes/example.js

const express = require('express');
const router = express.Router();

/**
 * @route   GET /example/hello
 * @desc    Simple example route
 * @access  Public
 */
router.get('/hello', (req, res) => {
  return res.json({ message: 'Hello, world!' });
});

module.exports = router;
```

### api.jsx
For APIs, react is quite flexible, you just need to make sure the path is referenced properly if you were to use it in your components or App.jsx

```bash
import axios from 'axios'; # axios requires importing but fetch does'nt
const URL = "http://127.0.0.1:4444" #define the URLs as constants here to ensure reusability when you are writing out your functions

export async function yourFunction(parameter) {

  `logic goes here....`
  return await axios.post(`${URL}/route`, parameter); #use string formatting to create the api string make sure the method - axios.post() corresponds to the request type of your backend route so in backend if it is using .get, use .get in here too
}
```

## Comments

I recommend adding your name under each code that you do, I might not do this for Sprint 1 due to lack of time so pray the teacher understands your contributions in the trello board and sprint report










