import os
from llama_index.core import (SimpleDirectoryReader, Document, VectorStoreIndex, Settings, load_index_from_storage)
from llama_index.core.tools import FunctionTool
from dotenv import load_dotenv
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import VectorStoreIndex
from llama_index.core import StorageContext
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.groq import Groq
import psycopg
import chromadb
from chromadb.config import Settings as ChromaSettings
from llama_index.llms.ollama import Ollama
from llama_index.core.llms import ChatMessage, TextBlock, ImageBlock
from chromadb.utils import embedding_functions
import re
from llama_index.core.memory import Memory

# text to sql
from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    String,
    Integer,
    select,
)
from llama_index.core import SQLDatabase
from llama_index.core.query_engine import NLSQLTableQueryEngine
from sqlalchemy import text
from llama_index.core.schema import TextNode
from llama_index.core import StorageContext
import os
from pathlib import Path
from typing import Dict, List, Tuple
from llama_index.core.retrievers import SQLRetriever
from typing import List
# from llama_index.core.query_pipeline import FnComponent

from llama_index.core.objects import (
    SQLTableNodeMapping,
    ObjectIndex,
    SQLTableSchema,
)

from llama_index.core.prompts.default_prompts import DEFAULT_TEXT_TO_SQL_PROMPT
from llama_index.core import PromptTemplate
# from llama_index.core.query_pipeline import FnComponent
from llama_index.core.llms import ChatResponse

from llama_index.core.workflow import (
    StartEvent,
    StopEvent,
    Workflow,
    step,
    Event
)

# load the env variables

# Get the absolute directory of the current script file
base_dir = os.path.dirname(os.path.abspath(__file__))
# Build the absolute path to your .env file relative to the script
env_path = os.path.join(base_dir, '../../../../.env')
load_dotenv(env_path)

USERNAME = os.getenv("TINKER_USERNAME")
PASSWORD = os.getenv("TINKER_PASSWORD")
HOST = os.getenv("TINKER_HOST")
PORT = os.getenv("TINKER_PORT")
DATABASE = os.getenv("TINKER_DATABASE")
DATABASE_URL = f"postgresql+psycopg2://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_SQL_API_KEY = os.getenv("GROQ_SQL_API_KEY")
GROQ_TESTING_KEY = os.getenv("GROQ_TESTING_KEY")
GROQ_TESTING_KEY_N = os.getenv("GROQ_TESTING_KEY_N")
GROQ_TESTING_KEY_H = os.getenv("GROQ_TESTING_KEY_H")
GROQ_TESTING_KEY_A = os.getenv("GROQ_TESTING_KEY_A")

#  configuring model
Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

# create sql_database
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
sql_database = SQLDatabase(engine, include_tables=["devices", "devicedata", "sensors", "sensordata"])

# set up vector db
# define chroma
client = chromadb.HttpClient(host='localhost', port=7000)
sql_collection = client.get_collection('sql_embeddings')

# llms
sql_llm = Groq(model="llama-3.3-70b-versatile", api_key=GROQ_TESTING_KEY_H)
sql_response_llm = Groq(model="llama-3.1-8b-instant", api_key=GROQ_TESTING_KEY_H)#Groq(model="qwen/qwen3-32b", api_key=GROQ_TESTING_KEY)

# set the collection to be used for the rag engine
sql_vector_store = ChromaVectorStore(chroma_collection=sql_collection)
sql_storage_context = StorageContext.from_defaults(vector_store=sql_vector_store)
sql_chroma_index = VectorStoreIndex.from_vector_store(vector_store=sql_vector_store, embed_model=embed_model)

# test
row_retriever = sql_chroma_index.as_retriever(similarity_top_k=3)

# create a new collection in chromadb to store embeddings of first 100 rows in sql database
table_node_mapping = SQLTableNodeMapping(sql_database)
# Use this new, more robust schema definition

table_schema_objs = [
SQLTableSchema(
    table_name="devices",
    context_str="""
-- TECHNICAL SCHEMA --
CREATE TABLE devices (
    deviceid INTEGER PRIMARY KEY,
    devicename VARCHAR,
    devicetypeid INTEGER,
    devicedescription VARCHAR,
    locationid INTEGER,
    online BOOLEAN
);
-- FOREIGN KEYS from this table --
ALTER TABLE devices ADD FOREIGN KEY (devicetypeid) REFERENCES devicetypes (devicetypeid);
ALTER TABLE devices ADD FOREIGN KEY (locationid) REFERENCES locations (locationid); -- DO NOT USE THIS ID

-- BUSINESS LOGIC & RULES --
This table is a central registry for all IoT devices and their static metadata.
- **CRITICAL COLUMN NAME RULE:** The column containing the human-readable name of the device is called `devicename`. **It is NOT called `device`**. Any query that needs to SELECT, GROUP BY, or filter on the device's name MUST use `devicename`.
- **CRITICAL JOIN PATH:** To find the name of the device for any sensor reading, you MUST join from `sensordata` -> `devicedata` -> `devices`."""
),

    SQLTableSchema(
        table_name="devicedata",
        context_str=
"""
This table is the **CRITICAL JUNCTION** that links a device to its sensor readings. It represents a single data packet event.
- **This is the ONLY table that connects 'devices' (via deviceid) to 'sensordata' (via devicedataid).**
- **CRITICAL JOIN RULE:** Any query needing device information (like name) for a sensor reading **MUST** join `sensordata` to this `devicedata` table first, and THEN join `devicedata` to the `devices` table.
- **JOIN EXAMPLE:** `... FROM sensordata sd JOIN devicedata dd ON sd.devicedataid = dd.devicedataid JOIN devices d ON dd.deviceid = d.deviceid ...`
- **TIME FILTERING:** The `dbtimestamp` column is essential for all time-based queries. Use it to filter for specific dates or times (e.g., 'today', 'last week'). If no time is specified, assume the user wants recent data (e.g., last 24 hours).
"""
    ),

    SQLTableSchema(
        table_name="sensordata",
        context_str=
"""
This table stores ALL individual sensor readings.
- **IMPORTANT: This table DOES NOT have a 'deviceid' column.** It cannot be joined directly to the 'devices' table.
- **CRITICAL JOIN RULE:** To find which device took a reading, you **MUST** join this table to `devicedata` on the composite key `(sensordata.devicedataid = devicedata.devicedataid AND sensordata.parentdevicedbtimestamp = devicedata.dbtimestamp)`.
- **FULL JOIN PATH EXAMPLE:** To find the device name for a sensor reading, the path is: `sensordata` -> `devicedata` -> `devices`.
- To find a specific type of sensor value (like 'Soil EC'), you MUST join with the `sensors` table on `sensorid`."""
    ),

    SQLTableSchema(
        table_name="sensors",
        context_str=
"""
This is a lookup table to get the name and description of a sensor from its 'sensorid'.
- You **MUST** use this table to filter by sensor type.
- **EXAMPLE:** To find 'Soil EC' values, join `sensordata` with this table and use `WHERE sensors.sensor LIKE 'Soil EC'`."""
    )
]

obj_index = ObjectIndex.from_objects(
    table_schema_objs,
    table_node_mapping,
    VectorStoreIndex,
    embed_model=embed_model
)
obj_retriever = obj_index.as_retriever(similarity_top_k=3)


sql_retriever = SQLRetriever(sql_database)

# get context from the  database
# def get_table_context_str(table_schema_objs: List[SQLTableSchema]):
#     """Get table context string."""
#     context_strs = []
#     for table_schema_obj in table_schema_objs:
#         table_info = sql_database.get_single_table_info(
#             table_schema_obj.table_name
#         )
#         if table_schema_obj.context_str:
#             table_opt_context = " The table description is: "
#             table_opt_context += table_schema_obj.context_str
#             table_info += table_opt_context

#         context_strs.append(table_info)
#     return "\n\n".join(context_strs)

# table_parser_component = FnComponent(fn=get_table_context_str)


# prompt template to construct a way to query the database
sql_preamble = """### Task
Generate a single, syntactically correct SQL query to answer the user's question.

### Rules
1.  **Pay EXTREME attention to the column names** provided in the table schemas. If the schema says `devicename`, you MUST use `devicename`. Do not invent or shorten column names.
2.  Follow all `CRITICAL JOIN RULE` and `CRITICAL ACTION` instructions in the table descriptions precisely. The join path for sensor readings is always `sensordata` -> `devicedata` -> `devices`.
3.  **DO NOT USE the `locationid`in devices table** to find device information for a sensor reading. Use the devicename instead.
4.  **LIMIT RULE:** You MUST append `LIMIT 20` to the end of EVERY SINGLE SQL query to ensure performance, unless the user explicitly asks for a different limit.
5.  **AGGREGATION RULE:** If the user asks for a result "for each," "per," "by device," or asks for an "average," "total," "sum," "count," or "list," you MUST use a `GROUP BY` clause. The query should group by the relevant dimension (like `devices.devicename`) and use an aggregate function (like `AVG()`, `SUM()`, `COUNT()`, `STRING_AGG()`) on the values.
6. **TIME FILTER RULE**:
- Use devicedata.dbtimestamp for time filtering.
- Default: If the query implies “latest”, “current”, or “recent” without a time range, add: WHERE dd.dbtimestamp >= NOW() - INTERVAL '1 day'
- Explicit Time: If the user specifies a range (e.g., "today", "this week", "in May"), convert it to a WHERE clause using dd.dbtimestamp.
- Examples:
    “Today”: WHERE dd.dbtimestamp >= date_trunc('day', NOW())
    “This week”: WHERE dd.dbtimestamp >= date_trunc('week', NOW())

### SQL Query Generation
Based on the user's question and the provided schema, generate the SQL query below.
"""

# The original template from LlamaIndex looks something like this:
# "Query: {query_str}\nSQLQuery: "
# We want to prepend our rules to it.
original_template = "Query: {query_str}\nSQLQuery:" # Simplified for clarity

# We will construct a new template string that includes our rules.
# The placeholder {query_str} will come from the LlamaIndex workflow.
# The placeholder {schema} will also be filled in by the workflow with the table contexts.
new_template_str = (
    sql_preamble
    + "### Table Schemas\n{schema}\n\n" # The workflow will put the table schemas here
    + "### Relevant Data Examples\n{rows}\n\n" # The workflow will put the example rows here ONCE
    + original_template # This adds the "Query: {query_str}\nSQLQuery:" part
)

# This new PromptTemplate object is what you will pass to your workflow.
text2sql_prompt = PromptTemplate(new_template_str)


# format the response
response_synthesis_prompt_str = (
    "Given an input question, synthesize a response from the query results.\n"
    "Query: {query_str}\n"
    "SQL: {sql_query}\n"
    "SQL Response: {context_str}\n"
    "Response: "
)
response_synthesis_prompt = PromptTemplate(
    response_synthesis_prompt_str,
)

# define events for the workflow
class TablesRetrieved(Event):
    """Event fired after relevant table schemas have been retrieved."""
    query_str: str
    table_schemas: List[SQLTableSchema]

class ContextGenerated(Event):
    """Event fired after the full table context (schema + rows) is generated."""
    query_str: str
    # context_str: str
    schema_context_str: str  # NEW
    row_context_str: str     # NEW

class SQLGenerated(Event):
    """Event fired after the Text-to-SQL model has generated a SQL query."""
    query_str: str
    sql_query: str

class SQLResult(Event):
    """Event fired after the SQL query has been executed."""
    query_str: str
    sql_query: str
    sql_result_str: str

# helper function to execute SQL query
# def get_table_context_and_rows_str(
#     sql_database, query_str: str, table_schema_objs: List[SQLTableSchema]
# ) -> str:
#     # ... (This is the same function from my first answer, but now it will be a method)
#     # ... It needs sql_database and vector_index_dict passed to it.
#     context_strs = []
#     for table_schema_obj in table_schema_objs:
#         table_info = sql_database.get_single_table_info(table_schema_obj.table_name)
#         if table_schema_obj.context_str:
#             table_info += f" The table description is: {table_schema_obj.context_str}"

#         relevant_nodes = row_retriever.retrieve(query_str)
#         if relevant_nodes:
#             table_row_context = "\nHere are some relevant example rows (values in the same order as columns above):\n"
#             for node in relevant_nodes:
#                 table_row_context += f"{node.get_content()}\n"
#             table_info += table_row_context
#         context_strs.append(table_info)
#     return "\n\n".join(context_strs)

def get_table_context_and_rows_str(
    sql_database, table_schema_objs: List[SQLTableSchema], relevant_nodes: List[TextNode]) -> Tuple[str, str]:

    """
    Gets table context string and a separate string for relevant rows.
    This prevents row context from being duplicated for each table.
    """
    # First, build the schema context string
    schema_strs = []
    for table_schema_obj in table_schema_objs:
        # We will use a leaner function here in Solution #2, for now this is fine
        table_info = sql_database.get_single_table_info(table_schema_obj.table_name)
        if table_schema_obj.context_str:
            table_info += f"\n-- Description and Rules --\n{table_schema_obj.context_str}"
        schema_strs.append(table_info)
    schema_context_str = "\n\n".join(schema_strs)

    # Second, build the row context string just once
    row_context_str = "No relevant example rows found."
    if relevant_nodes:
        row_context_list = ["Relevant example rows (values in the same order as columns above):"]
        for node in relevant_nodes:
            row_context_list.append(node.get_content())
        row_context_str = "\n".join(row_context_list)

    return schema_context_str, row_context_str


# Helper function (not a @step)
def parse_response_to_sql(response_content: str) -> str:
    """
    A robust function to parse the LLM's response to extract a SQL query.
    It intelligently finds a SQL code block, even if it's surrounded by text.
    """
    # 1. Look for a SQL code block enclosed in ```sql ... ```
    sql_code_block_match = re.search(r"```(sql)?(.*)```", response_content, re.DOTALL | re.IGNORECASE)
    
    if sql_code_block_match:
        # If found, extract the content of the block
        print("Parser found a SQL code block.")
        sql_query = sql_code_block_match.group(2).strip()
        return sql_query

    # 2. As a fallback, try to find the 'SQLQuery:' tag
    sql_query_start = response_content.find("SQLQuery:")
    if sql_query_start != -1:
        print("Parser found 'SQLQuery:' tag.")
        response = response[sql_query_start + len("SQLQuery:") :]
        sql_result_start = response.find("SQLResult:")
        if sql_result_start != -1:
            response = response[:sql_result_start]
        return response.strip()

    # 3. If neither is found, the LLM likely failed to produce a query.
    #    Return the whole response and let the DB error out, or return empty.
    print("Warning: Parser could not find a distinct SQL code block or 'SQLQuery:' tag. Returning the raw response for debugging.")
    # For robust production, you might return "" here. For debugging, returning the content is useful.
    return response_content # or return ""

# tell the query engine not to query too many rows
def enforce_limit_clause(sql_query: str, limit: int = 20) -> str:
    """
    Checks if a SQL query has a LIMIT clause. If not, it appends one.
    This is a safety net to prevent runaway queries.
    It's designed to be simple and won't handle extremely complex nested queries perfectly,
    but it covers the vast majority of cases.
    """
    # Use a case-insensitive regex to check for 'LIMIT' at the end of the query,
    # ignoring trailing semicolons and whitespace.
    if re.search(r'LIMIT\s+\d+\s*;?$', sql_query, re.IGNORECASE):
        # A LIMIT clause already exists, so do nothing.
        print("LIMIT clause already exists. Skipping enforcement.")
        return sql_query
    else:
        # No LIMIT clause found, so append one.
        print(f"No LIMIT clause found. Enforcing LIMIT {limit}.")
        # Strip any trailing semicolon or whitespace before appending
        sql_query = sql_query.strip().rstrip(';')
        return f"{sql_query} LIMIT {limit};"

# workflow
class AdvancedSQLWorkflow(Workflow):
    def __init__(
        self,
        sql_database,
        obj_retriever: ObjectIndex,
        sql_retriever: SQLRetriever,
        text2sql_llm,
        row_retriever,
        response_synthesis_llm,
        text2sql_prompt: PromptTemplate,
        response_synthesis_prompt: PromptTemplate,
        **kwargs,
    ):
        super().__init__(**kwargs)
        # Store all our tools and components
        self.sql_database = sql_database
        self.obj_retriever = obj_retriever
        self.sql_retriever = sql_retriever
        self.text2sql_llm = text2sql_llm
        self.row_retriever = row_retriever
        self.response_synthesis_llm = response_synthesis_llm
        self.text2sql_prompt = text2sql_prompt
        self.response_synthesis_prompt = response_synthesis_prompt

    @step
    async def retrieve_tables(self, ev: StartEvent) -> TablesRetrieved:
        """Retrieves relevant table schemas based on the input query."""
        query_str = ev.get("query", None) # The `run` method will pass 'query' in.
        if not query_str:
            raise ValueError("Query not provided to workflow.")

        print(f"Step 1: Retrieving tables for query: '{query_str}'")
        retrieved_schemas = self.obj_retriever.retrieve(query_str)
        return TablesRetrieved(query_str=query_str, table_schemas=retrieved_schemas)

    @step
    async def generate_context(self, ev: TablesRetrieved) -> ContextGenerated:
        """Generates the full context string including schemas and example rows."""
        print("Step 2: Generating context from tables.")

        print("Retrieving relevant example rows...")
        relevant_nodes = self.row_retriever.retrieve(ev.query_str)

        # context_str = get_table_context_and_rows_str(
        #     self.sql_database, 
        #     # ev.query_str, 
        #     ev.table_schemas,
        #     relevant_nodes # added new parameter to retrieve relevant rows
        # )
        # return ContextGenerated(query_str=ev.query_str, context_str=context_str)
        # This now returns two strings
        schema_context, row_context = get_table_context_and_rows_str(
            self.sql_database,
            ev.table_schemas,
            relevant_nodes
        )
        
        # Populate the new event fields
        return ContextGenerated(
            query_str=ev.query_str,
            schema_context_str=schema_context,
            row_context_str=row_context
        )

    @step
    async def generate_sql(self, ev: ContextGenerated) -> SQLGenerated:
        """Uses an LLM to generate a SQL query from the context."""
        print("Step 3: Generating SQL query.")
        # prompt = self.text2sql_prompt.format(query_str=ev.query_str, schema=ev.context_str)
        prompt = self.text2sql_prompt.format(
        query_str=ev.query_str,
        schema=ev.schema_context_str, # Use the schema context
        rows=ev.row_context_str       # Use the row context
        )
        print(len(prompt))
        response = await self.text2sql_llm.acomplete(prompt)
        sql_query = parse_response_to_sql(response.text)
        # enforce the limit
        enforced_sql_query = enforce_limit_clause(sql_query)
        return SQLGenerated(query_str=ev.query_str, sql_query=enforced_sql_query)

    @step
    async def execute_sql(self, ev: SQLGenerated) -> SQLResult:
        """Executes the generated SQL query against the database."""
        print(f"Step 4: Executing SQL: {ev.sql_query}")
        sql_result_nodes = self.sql_retriever.retrieve(ev.sql_query)
        sql_result_str = "\n".join([r.get_content() for r in sql_result_nodes])
        return SQLResult(
            query_str=ev.query_str,
            sql_query=ev.sql_query,
            sql_result_str=sql_result_str,
        )

    @step
    async def synthesize_response(self, ev: SQLResult) -> StopEvent:
        """Synthesizes the final natural language response."""
        print("Step 5: Synthesizing final response.")
        prompt = self.response_synthesis_prompt.format(
            query_str=ev.query_str,
            sql_query=ev.sql_query,
            context_str=ev.sql_result_str,
        )
        response = await self.response_synthesis_llm.acomplete(prompt)
        return StopEvent(result=response.text)

# wrap workflow in function
async def run_sql_workflow(query_str: str) -> str:
    """Executes the advanced SQL workflow for a given query."""
    workflow = AdvancedSQLWorkflow(
        sql_database=sql_database,
        obj_retriever=obj_retriever,
        sql_retriever=sql_retriever,
        row_retriever=row_retriever, # added row retriever
        text2sql_llm=sql_llm, # Using the same llm
        response_synthesis_llm=sql_response_llm, # Using the same llm
        text2sql_prompt=text2sql_prompt,
        response_synthesis_prompt=response_synthesis_prompt,
        verbose=True, # You can enable verbose logging here
    )
    result = await workflow.run(query=query_str)
    return result
