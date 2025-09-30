# DSCP - Team 3

This is DSCP Team 3's GitHub repository. It contains code and documentation for various tasks related to the DSCP project.

## 👥 Team Members

- **Zachariah** (Team Leader)
- **Nabihah**
- **Aden**
- **Harith**
- **Dexter**

## 🚀 Getting Started

Follow these steps to set up the DSCP Team 3 project on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/trashprog/DSCP-Team-3.git
cd dscp-team3
```
Install dependencies in the frontend folder
```bash
cd "Fullstack application"
cd frontend
npm install
npm install axios
npm install tailwindcss @tailwindcss/vite
```

Install dependencies for the fast_api backend
```bash
pip install \
  fastapi \
  uvicorn \
  python-dotenv \
  psycopg[binary] \
  pgvector \
  llama-index \
  llama-index-llms-ollama \
  llama-index-embeddings-huggingface \
  "sentence-transformers" \
  llama-index-vector-stores-postgres \
  llama-index-vector-stores-chroma
```
or
```
cd fastapi_app
pip install requirements.txt
```

Similiarly, install the node packages in the backend folder as well
```bash
cd backend
cd express_app
npm install
```

#### Install Ollama locally (optional)

Download Ollama Locally here: [https://ollama.com/download/windows](URL)

Open your command prompt and type ```ollama``` to check if it is installed

Install the model
```
ollama run llama3.2:3b
```

Run '''ollama list''' to check if the model has been installed


### 2. Setting Up PostgreSQL and ChromaDB with Docker

#### Postgres
```bash
cd DSCP-Team-3
```
Build the docker image <b>postgres-database</b> is the name of the image, you can change it however you like
```bash
docker build -t postgres-database .
```

Run the Docker Container where container name is dscp-pg-team3 
```bash
docker run --name dscp-pg-team3 -e POSTGRES_PASSWORD=yourpassword -d -p 5432:5432 postgres-database
```

Connect to the database in your terminal
``` bash
docker exec -it dscp-pg-team3 psql -U postgres
```

Run the dumps.sql file to install all tables
```bash
docker exec -i dscp-pg-team3 psql -U postgres -d <your_database_name> < /path/to/dumps.sq
```

#### Groq
Create an account and create an api_key here -> [https://console.groq.com/keys](URL)

#### AWS
Create an AWS account and create a bucket, set everything to publich and configure an IAM policy and attach it to a user, get its access and secret key

In the .env files, edit the .env file to match the previous password you keyed in previously
```
DATABASE=dscp_team3_db -> your database
HOST=localhost -> same
PASSWORD=dscp-team3 -> your password
PORT=5432  -> same unless you changed the port number
USER=postgres  -> same
TABLE_NAME=users  -> can be renamed as you wish
EMBED_DIM=384  -> same
GROQ_API_KEY -> Your groq api key here
AWS_S3_ACCESS_KEY -> acces key
AWS_S3_SECRET_KEY -> secret key
AWS_REGION -> region
AWS_S3_BUCKET -> bucket name
```
#### chromaDB

cd to your dscp github folder and run:
```bash
docker pull chromadb/chroma
```

next run this line. 8000 is the port the contianer runs its services in while 7000 is the port where users can make requests to it
```bash
docker run -v ./chroma-data:/data -p 7000:8000 chromadb/chroma
```

#### Running the insert document script
Once connected to the database, in the "Multi-modal Chatbot to Explain Live Sensor Data and Images" folder, run the script.
This will embded the documents into a new database
```bash
cd "Multi-modal Chatbot to Explain Live Sensor Data and Images" -- assuming you are currently in DSCP-Team-3
python insertDocuments.py
```

#### Grafana
download the grafana docker image -> [https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/](URL)
create your visuals then edit the .ini file to set embed to true, instructions is found here: [https://youtu.be/Ct9PjmrExzo?si=1CwPaTQNFsQbi7L9](URL)

### 3. Checking if everything works

Start the frontend
```bash
cd "Fullstack application"
cd frontend
npm run dev
```

Start the backend python
```bash
cd "Fullstack application"
cd backend
cd fastapi_app
uvicorn app:app --reload --depending on your computer add a python infront if it does not work
```

Start the backend expressJS
```bash
cd "Fullstack application"
cd backend
cd express_app
node index.js --depending on your computer add a python infront if it does not work
```

## You should be able to start the website, feel free to test out prompts related to vermicomposting happy coding!!






