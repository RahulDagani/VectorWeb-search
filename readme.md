# 🚀 VectorWeb Semantic Search  
A full-stack semantic search application that extracts content from any webpage, converts it into embeddings, stores vectors in Pinecone, and performs semantic similarity search using FastAPI as backend and React as frontend.

---

# 📌 Features

- 🔍 **Semantic Search** — Meaning-based search across any webpage URL  
- 🌐 **Web Scraping** — Extracts clean text using BeautifulSoup  
- ✂️ **Chunking** — Splits text into ~500-token chunks  
- 🧠 **Embeddings** — Uses `all-MiniLM-L6-v2` from SentenceTransformers  
- 📦 **Pinecone Vector DB** — Stores & retrieves vector representations  
- ⚡ **FastAPI Backend** — Handles scraping, embedding, indexing & searching  
- 🎨 **React + Tailwind Frontend** — Clean UI to query semantic results  

---

# 🏗️ Technology Stack

### **Frontend**
- React (Vite)
- Tailwind CSS
- lucide-react icons

### **Backend**
- FastAPI
- Python 3.10+
- BeautifulSoup4
- HTTPX
- SentenceTransformers
- Pinecone Serverless

---

# ⚙️ Prerequisites

Make sure you have the following installed:

- **Node.js** (16+)
- **Python** (3.8+)
- **Pinecone API Key** → https://app.pinecone.io  
- **Git**

---

# 📂 Project Structure

```
VectorWeb-Submission/
│── README.md
│── .gitignore
│
├── client/                 # React Frontend
│   ├── package.json
│   ├── package-lock.json
│   ├── public/
│   └── src/
│       └── App.jsx
│
└── server/                 # FastAPI Backend
    ├── main.py
    └── requirements.txt
```

---

# 🖥️ Backend Setup (FastAPI)

### 1️⃣ Navigate into the backend folder

```
cd server
```

### 2️⃣ Create a virtual environment (optional but recommended)

Windows:
```
python -m venv venv
venv\Scripts\activate
```

Mac/Linux:
```
python3 -m venv venv
source venv/bin/activate
```

### 3️⃣ Install dependencies

```
pip install -r requirements.txt
```

### 4️⃣ Add your Pinecone API key  
In `main.py`, update:

```
PINECONE_API_KEY = "YOUR_API_KEY"
```

### 5️⃣ Run the backend server

```
uvicorn main:app --host 0.0.0.0 --port 8000
```

Backend will run at:

👉 http://localhost:8000  
👉 http://localhost:8000/docs (Swagger API UI)

---

# 🎨 Frontend Setup (React)

### 1️⃣ Navigate into the frontend folder

```
cd client
```

### 2️⃣ Install dependencies

```
npm install
```

### 3️⃣ Start React development server

```
npm run dev
```

Frontend will run at:

👉 http://localhost:5173  

---

# 🧩 Pinecone Vector Database Setup

1. Login to **https://app.pinecone.io**
2. Create a project (Serverless recommended)
3. Create an Index:
   - **Name:** semantic-search-demo  
   - **Dimension:** `384`
   - **Metric:** `cosine`
   - **Cloud:** AWS  
   - **Region:** us-east-1  
4. Copy your **API Key**  
5. Paste into `main.py` → `PINECONE_API_KEY = "..."`

---

# 🚀 How It Works (High-Level Flow)

1. User enters:
   - Website URL  
   - Semantic Query text  

2. Backend:
   - Scrapes webpage HTML  
   - Cleans text (removes navbars, script tags, etc.)  
   - Splits text into 500-token chunks  
   - Generates embeddings using SentenceTransformers  
   - Uploads embeddings to Pinecone  
   - Vector-searches the query embedding  
   - Returns most relevant matches  

3. Frontend:
   - Displays similarity score  
   - Shows extracted chunk content  
   - Allows viewing full context & copying text  

---

# 🛠️ Troubleshooting

### ❗ Backend Not Responding  
Make sure backend is running:

```
uvicorn main:app --port 8000
```

### ❗ "Unauthorized" Pinecone Error  
Check your API key inside `main.py`.

### ❗ CORS Error  
The backend already includes:

```
allow_origins=["*"]
```

So CORS should be open by default.

---

# 📬 Contact
If you have any issues running the project, feel free to reach out.

---

# ✅ End of Documentation
This README includes everything required by the hiring team:
- Setup instructions  
- Dependencies  
- Prerequisites  
- Pinecone configuration  
- Folder structure  
- How to run the project  

