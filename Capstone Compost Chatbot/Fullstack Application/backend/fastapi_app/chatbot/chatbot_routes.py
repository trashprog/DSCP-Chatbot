import os
import psycopg
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from llama_index.core.llms import ChatMessage
from collections import defaultdict
from llama_index.core.memory import Memory
from pydantic import BaseModel
from fastapi import HTTPException
from typing import Optional
import asyncio
from uuid import uuid4, UUID

termination_events: dict[UUID, asyncio.Event] = {}

class TerminateStreamModel(BaseModel):
    stream_id: UUID

class UserIdModel(BaseModel):
    userid: int

# load env variables

# Get the absolute directory of the current script file
base_dir = os.path.dirname(os.path.abspath(__file__))

# Build the absolute path to your .env file relative to the script
env_path = os.path.join(base_dir, '../../../../.env')

load_dotenv(env_path)
dbname = os.getenv("DATABASE")
user = os.getenv("USER")
password = os.getenv("PASSWORD")
host = os.getenv("HOST")
port = os.getenv("PORT")

# improt methods from module
from .chat_engine import (
    query_engine,
    process_chat_query,
    # stream_from_ollama,
    stream_topic,
    # set_chat_engine
    set_memory
)

# {sessionid: chat_engine, sessionid: chat_engine}
chat_memories = {}
chatbot_router = APIRouter(prefix="/chatbot")

# reusing the chat engines
async def get_or_create_memory(sessionid: int):
    if sessionid not in chat_memories:
        chat_memories[sessionid] = await set_memory(sessionid)
    return chat_memories[sessionid]

# so what this does here would be that it will call the get_or_create_chat_engine function to check for an existing chat engine corresponding to the session id
# if the session id does not exist, it will create a new chat engine and store it in the chat_engines dictionary, the dictionanry will only exist
# during the lifetime of the application, so it will not persist across server restarts

# update! - now when the user logouts and logins, the messages will be passed back into the chatengine, ensuring the chatbot remembers
@chatbot_router.get("/ragRoute")
async def prompt_llama(query: str, sessionid: int, image_url: Optional[str] = None):
    # ... (code to generate stream_id, get memory, create event) ...
    stream_id = uuid4()
    memory = await get_or_create_memory(sessionid)
    termination_event = asyncio.Event()
    termination_events[stream_id] = termination_event

    async def event_managed_generator():
        try:
            # --- MODIFIED FUNCTION CALL TO MATCH NEW ORDER ---
            # The call to process_chat_query must be updated.
            # We now pass termination_event before image_url.
            async for chunk in process_chat_query(memory, query, termination_event, image_url=image_url):
                yield chunk
        except Exception as e:
            print(f"An error occurred during streaming for {stream_id}: {e}")
        finally:
            # CRITICAL: Clean up the event from the global dict
            if stream_id in termination_events:
                del termination_events[stream_id]
                print(f"Cleaned up termination event for stream: {stream_id}")

    # ... (rest of the function to create and return StreamingResponse) ...
    response = StreamingResponse(event_managed_generator(), media_type="text/plain")
    response.headers["X-Stream-ID"] = str(stream_id)
    response.headers["Access-Control-Expose-Headers"] = "X-Stream-ID"
    
    return response

@chatbot_router.get("/topic")
async def create_topic(query: str):
    # reset_model()
    return StreamingResponse(stream_topic(query_engine, query), media_type="text/plain")


# deleting the session kvp from the chat_engines dictionary
@chatbot_router.delete("/session/{sessionid}")
async def delete_session(sessionid: int):
    if sessionid in chat_memories:
        del chat_memories[sessionid]
        return {"status": f"Session {sessionid} removed from memory"}
    else:
        # Return success even if session not found, for graceful behavior
        return {"status": f"Session {sessionid} not found in memory (already deleted or never loaded)"}


# reload the chatbot memory
@chatbot_router.post("/reload-memory")
async def reload_memory(payload: UserIdModel):

    userid = payload.userid

    # connect to database
    session_messages = defaultdict(list)

    conn = psycopg.connect(
    dbname=dbname,
    user=user,
    password=password,
    host=host,
    port=port
    )

    # open cursor to query messages
    with conn.cursor() as cur:
        cur.execute("""
            SELECT cs.sessionid, m.messageid, m.sender, m.content 
            FROM chatsessions cs 
            JOIN messages m ON cs.sessionid = m.sessionid
            WHERE cs.userid = %s
            ORDER BY m.timestamp ASC;
        """, (userid,))
        results = cur.fetchall()

        for sessionid, _, sender, content in results:
            session_messages[sessionid].append(ChatMessage(role=sender, content=content))

    conn.close()

    # inject messages 
    for sessionid, messages in session_messages.items():
        memory = Memory.from_defaults(session_id=str(sessionid), token_limit=10000)
        memory.put_messages(messages)

        # await set_chat_engine(sessionid, memory)

        chat_memories[sessionid] = memory

    return {"status": "reloaded"}


