import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
import os
import re
import time
import urllib.request
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
import uuid

# --- App Initialization ---
app = FastAPI(title="Vector Search Backend")

# --- CORS Setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Vector Database Setup (Pinecone) ---
# 1. Sign up for free at https://app.pinecone.io/
# 2. Create an API Key and paste it below:
PINECONE_API_KEY = "pcsk_7Pb17a_UgzkcedW233rH9mtTD94stoQLssS31gAUXskcRrze9Xay2he3kmf1Sh4bbT6nJS"

if PINECONE_API_KEY == "pcsk_7Pb17a_UgzkcedW233rH9mtTD94stoQLssS31gAUXskcRrze9Xay2he3kmf1Sh4bbT6nJS":
    print("⚠ WARNING: You must paste your Pinecone API Key in main.py line 25!")

# Initialize Pinecone
try:
    pc = Pinecone(api_key=PINECONE_API_KEY)
except:
    pc = None

INDEX_NAME = "semantic-search-demo"
VECTOR_DIMENSION = 384

# Initialize Embedding Model
print("Loading Embedding Model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


def setup_pinecone_index():
    """Creates the index if it doesn't exist."""
    if not pc:
        raise HTTPException(status_code=500, detail="Pinecone API Key is missing or invalid.")

    existing_indexes = [i.name for i in pc.list_indexes()]

    if INDEX_NAME not in existing_indexes:
        print(f"Creating Pinecone index '{INDEX_NAME}'...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=VECTOR_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        # Wait for index to be ready
        while not pc.describe_index(INDEX_NAME).status['ready']:
            time.sleep(1)
        print("Index created!")

    return pc.Index(INDEX_NAME)


# --- Models ---
class SearchRequest(BaseModel):
    url: str
    query: str
    limit: int = 10


# --- Helper Functions ---

def clean_html_content(html_text: str) -> str:
    """Shared logic to clean HTML content"""
    soup = BeautifulSoup(html_text, 'html.parser')
    for element in soup(
            ["script", "style", "header", "footer", "nav", "iframe", "noscript", "svg", "aside", "form", "meta",
             "link"]):
        element.extract()
    text = soup.get_text(separator=' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def fetch_with_urllib_fallback(url: str) -> str:
    """Engine B: Fallback"""
    print(f"⚠ Switching to fallback engine (urllib) for {url}...")
    req = urllib.request.Request(
        url,
        data=None,
        headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.read().decode('utf-8')


def fetch_and_clean_html(url: str) -> str:
    """Fetches URL and returns clean text content."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,/;q=0.8',
    }

    html_content = ""
    try:
        print(f"Attempting fetch via HTTPX for {url}...")
        with httpx.Client(follow_redirects=True, headers=headers, verify=False, timeout=20.0) as client:
            response = client.get(url)
            response.raise_for_status()
            html_content = response.text
    except Exception as e:
        print(f"HTTPX Engine failed: {e}")
        try:
            html_content = fetch_with_urllib_fallback(url)
        except Exception as e2:
            raise HTTPException(status_code=400, detail=f"All scrape attempts failed. Error: {str(e2)}")

    if not html_content:
        raise HTTPException(status_code=400, detail="Retrieved empty content from URL")

    return clean_html_content(html_content)


def chunk_text(text: str, max_tokens: int = 500) -> list[str]:
    words = text.split()
    chunks = []
    current_chunk = []
    current_count = 0
    max_words = int(max_tokens * 0.75)

    for word in words:
        current_chunk.append(word)
        current_count += 1
        if current_count >= max_words:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_count = 0
            if len(words) > 50:
                current_chunk = words[-50:]
                current_count = 50
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks


# --- API Endpoints ---

@app.get("/health")
async def health_check():
    if not pc:
        return {"status": "error", "detail": "Pinecone API Key missing"}
    return {"status": "ok", "database": "Pinecone"}


@app.post("/search")
async def search_content(request: SearchRequest):
    print(f"Processing: {request.url} | Query: {request.query}")

    # 1. Fetch & Chunk
    raw_text = fetch_and_clean_html(request.url)
    if not raw_text or len(raw_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short or empty.")

    chunks = chunk_text(raw_text, max_tokens=500)
    print(f"Generated {len(chunks)} chunks.")

    # 2. Embed
    try:
        # Pinecone expects list of floats
        vectors = embedding_model.encode(chunks).tolist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding error: {str(e)}")

    # 3. Indexing
    try:
        index = setup_pinecone_index()

        # For this demo, we delete all vectors to keep it clean (optional)
        try:
            index.delete(delete_all=True)
        except:
            pass

        # Prepare batch upsert
        vectors_to_upsert = []
        for i, chunk in enumerate(chunks):
            vector_id = str(uuid.uuid4())
            vectors_to_upsert.append({
                "id": vector_id,
                "values": vectors[i],
                "metadata": {"text": chunk, "source": request.url}
            })

        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            index.upsert(vectors=batch)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone Error: {str(e)}")

    # 4. Search
    try:
        query_vector = embedding_model.encode([request.query]).tolist()[0]

        search_res = index.query(
            vector=query_vector,
            top_k=request.limit,
            include_metadata=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search Error: {str(e)}")

    # 5. Format
    formatted_results = []
    for match in search_res['matches']:
        formatted_results.append({
            "id": match['id'],
            "content": match['metadata']['text'],
            "score": round(match['score'], 4)
        })

    return {"results": formatted_results}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)