# import json
import chromadb
from llama_index.core.llms import ChatMessage, ImageBlock, TextBlock
from llama_index.core import VectorStoreIndex, StorageContext, Settings
# NEW, CORRECT IMPORT
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
# from llama_index.llms.ollama import Ollama
from llama_index.vector_stores.chroma import ChromaVectorStore
# from llama_index.core.schema import TextNode
from llama_index.core.memory import Memory
from typing import Optional
import os
from dotenv import load_dotenv
import requests
import tempfile
from pathlib import Path
from llama_index.llms.groq import Groq
from llama_index.core.tools import QueryEngineTool, FunctionTool
from llama_index.core.agent.workflow import ReActAgent
from typing import Optional, AsyncGenerator, Generator
import re
import asyncio
from langchain_groq import ChatGroq
from llama_index.llms.langchain import LangChainLLM


# import sql_engine
from .sql_engine import run_sql_workflow

# load env vars

# Get the absolute directory of the current script file
base_dir = os.path.dirname(os.path.abspath(__file__))
# Build the absolute path to your .env file relative to the script
env_path = os.path.join(base_dir, '../../../../.env')
load_dotenv(env_path)

# configuring model
Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
# Settings.llm = Ollama(model="llama3.2")
# llm = Ollama(model="llama3.2")

#  groq models
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_TESTING_KEY = os.getenv("GROQ_TESTING_KEY")
GROQ_TESTING_KEY_N = os.getenv("GROQ_TESTING_KEY_N")
GROQ_TESTING_KEY_H = os.getenv("GROQ_TESTING_KEY_H")
GROQ_TESTING_KEY_A = os.getenv("GROQ_TESTING_KEY_A")

# chat_llm = Groq(model="qwen/qwen3-32b", api_key=GROQ_TESTING_KEY_H) 
qwen = ChatGroq(
    model="qwen/qwen3-32b",
    api_key=GROQ_TESTING_KEY_H,
    reasoning_effort="none"
)
chat_llm = LangChainLLM(llm=qwen)
mm_llm = Groq(model="meta-llama/llama-4-maverick-17b-128e-instruct", api_key=GROQ_TESTING_KEY_H)
agent_llm = Groq(model="llama-3.3-70b-versatile", api_key=GROQ_TESTING_KEY)
llm = Groq(model="llama-3.1-8b-instant", api_key=GROQ_TESTING_KEY_H)

# Chroma setup
chroma_client = chromadb.HttpClient(host='localhost', port=7000)
embeddings = chroma_client.get_collection(name="embeddings")
vector_store = ChromaVectorStore(chroma_collection=embeddings)
storage_context = StorageContext.from_defaults(vector_store=vector_store)
chroma_index = VectorStoreIndex.from_vector_store(vector_store=vector_store, embed_model=embed_model)

# topic generator
query_engine = chroma_index.as_query_engine(streaming=True, llm=llm)

# chat engine - the one responsible for outputting the final prompt in a friendly manner
chat_engine = chroma_index.as_chat_engine(
    streaming=True,
    llm=chat_llm,
    chat_mode="condense_plus_context",
    system_prompt = """
        You are Wally the Worm, a friendly assistant for composting and smart gardening.

        IMPORTANT:
        - Never show internal reasoning or tags like <think> — only final, helpful answers.
        - Stay clear, warm, and on-topic.

        You help with:
        1. Gardening & IoT sensor insights (e.g. soil moisture, temperature)
        2. Composting and organic waste
        3. Interpreting image descriptions

        Use the info given. Avoid planning steps. Just be helpful and human-like!
        """
        ,
    verbose=False
)



# tools
sql_tool = FunctionTool.from_defaults(
    fn=run_sql_workflow,
    name="sql_database_tool",
    description=(
        "Use this tool ONLY for questions asking for specific, real-time data or historical data "
        "from IoT devices. This includes questions about sensor readings (e.g., moisture, temperature), "
        "device status, or data related to a named pot or sensor like 'NP Group 3 Plant Pot 0'. "
        "This is the ONLY tool that can access live data."
    ),
)

query_tool = QueryEngineTool.from_defaults(
    query_engine = query_engine,
    name="compost_query_tool",
        description=(
        "Use this as your primary tool for all general knowledge questions about composting, gardening, "
        "plant care, troubleshooting plant problems (like yellow leaves), and organic waste. "
        "DO NOT use this tool for questions asking for live sensor data or specific device statuses."
    ),
)

# Agent
Router_agent = ReActAgent(
    tools=[sql_tool, query_tool],
    llm=agent_llm
)

# for describing image
async def get_image_description(image_url: str, text_prompt: str=None) -> str:
    try:
        vision_prompt = [
                ChatMessage(
                    role="system",
                    content="You are a helpful bot that looks at images related to composting or plants. "
                            "Give a useful description (e.g., 'plant leaves turning yellow' or 'wet compost with food scraps'). "
                ),
                ChatMessage(
                    role="user",
                    blocks=[
                        TextBlock(text=text_prompt if text_prompt else "What's in this image?"),
                        ImageBlock(url=image_url),
                    ],
                ),
            ]
        vision_response = await mm_llm.achat(vision_prompt)
        print(vision_response)
        description = str(vision_response).strip()
        return description
    except Exception as e:
        print(f"An unexpected error occurred during image analysis: {e}")
        return "An error occurred while analyzing the image."


# Streaming helpers
async def stream_topic(engine, query: str):
    print(f"Received query: {query}")
    try:
        streaming_response = engine.query(query)
        for token in streaming_response.response_gen:
            yield token
    except Exception as e:
        # Prevent the ASGI crash
        print(f"[topic Stream Error] {e}")
        yield "[Topic Error] Something went wrong while generating a response."


# for reinitializing the chat engine with short term memory
async def set_memory(sessionid:int, memory: Optional[Memory] = None):

    #if the memory is none, create a new one else use the one passed into it
    if memory is None:
        memory = Memory.from_defaults(session_id=str(sessionid), token_limit=10000)
    return memory

async def generate_proactive_question(image_description: str) -> AsyncGenerator[str, None]:
    """
    Analyzes an image description and, if relevant, generates a follow-up question
    about checking sensor data.
    """
    prompt = f"""Analyze the following image description: "{image_description}".
If the image plausibly contains a plant in a pot or a compost tank, generate this exact follow-up question, and nothing else:
"\n\n By the way, is this plant in one of your sensor-equipped pots? If so, tell me its name, and I can check its live data for you!"
If the image is clearly not a plant in a pot (e.g., it's a compost pile, a single leaf, etc.), do not generate any text."""
    try:
        # Use the fast LLM for this simple classification/generation task
        streaming_response = await llm.astream_chat([ChatMessage(role="user", content=prompt)])
        for token in streaming_response:
            yield token.delta
    except Exception as e:
        print(f"Error in proactive question generation: {e}")
        # Yield nothing on error to avoid disrupting the chat flow.


async def process_chat_query(memory, query, termination_event: asyncio.Event, image_url: Optional[str] = None) -> AsyncGenerator[str, None]:
    # Processes a chat query. If an image_url is provided, it first gets a description
    # of the image and then combines it with the user's query before sending it to the chat engine.
    # This function streams the response.
    # final_query = query

    info_context = "" # This will hold the factual information gathered by our tools.
    image_description = "" # MODIFIED: Store description for later use

    if image_url:
        # Call the updated function that works with URLs directly
        image_description = await get_image_description(image_url, query)

        if termination_event.is_set(): return

        agent_input_query = f"""
        A user has uploaded an image and a question.
        
        Image Description: "{image_description}"
        User's Question: "{query}"
        
        Based on both the image description and the user's question, determine the best course of action.
        """
        print(f"[Workflow]: Augmented query for agent:\n{agent_input_query}")

        # rag_query = f"""Based on this image description: "{image_description}", answer the user's question: "{query.strip()}" """
        # rag_response = await query_engine.aquery(rag_query)
        # info_context = rag_response
        
        # Combine the description with the original query for the RAG engine
        # final_query = f"""
        # First, carefully analyze the following image description:
        # "{description}"
        # Then, based on what the image shows, answer this user question:
        # "{query.strip()}"
        # Use the image as your primary source of information. If necessary, draw on your knowledge of composting, plants, or organic waste to provide accurate and helpful details. Be specific, concise, and informative in your response.
        # """
    
    print("passing into agent")
    agent_input = agent_input_query if image_url else query
    agent_response = await Router_agent.run(agent_input, memory=memory)
    info_context = agent_response

    if termination_event.is_set(): return

    # final response
    final_prompt = f"""A user asked: "{query}".
    Using the following information you've found:
    ---
    {image_description}
    ---
    {info_context}
    ---
    Please formulate a helpful and friendly response to the user's original question."""

    print("[Workflow]: Passing context to final chat engine for conversational response.")


    # Stream the chat response from the engine
    try:
        # begun_thinking=True
        streaming_response = chat_engine.stream_chat(final_prompt)
        for token in streaming_response.response_gen:
            if termination_event.is_set(): return
            # if "<think>" in token:
            #     begun_thinking = True
            #     continue  # skip the token that opens the block
            # elif "</think>" in token:
            #     begun_thinking = False
            #     continue  # skip the closing tag too
            # if not begun_thinking:
            yield token
    except Exception as e:
        # Prevent the ASGI crash
        print(f"[Chat Stream Error] {e}")
        yield "[ERROR] Something went wrong while generating a response. Please try again"
        return # exits if main response fails
    
    if termination_event.is_set(): return
    # proacive engagement lol
    if image_url and image_description:
        print("[Workflow]: Generating proactive follow-up question.")
        async for token in generate_proactive_question(image_description):
            yield token

# gonna throw away
# async def stream_from_ollama(engine, query: str):
#     print(f"Received query: {query}")
#     streaming_response = engine.stream_chat(query)
#     for token in streaming_response.response_gen:
#         yield token

# Export items needed in router
__all__ = [
    "query_engine",
    # "stream_from_ollama", 
    "stream_topic",
    "process_chat_query",
    # "set_chat_engine",
    "set_memory"
]

