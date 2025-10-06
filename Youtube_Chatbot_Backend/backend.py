from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import http.client
import torch
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from pinecone_text.sparse import BM25Encoder
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import CrossEncoder
from langchain_ollama import ChatOllama
from langchain.text_splitter import RecursiveCharacterTextSplitter

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Pinecone Setup 
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME", "youtube-transcripts-index")

if index_name not in pc.list_indexes().names():

    pc.create_index(
        name=index_name,
        dimension=384,         
        metric="dotproduct",
        spec=ServerlessSpec(cloud="aws", region=os.getenv("PINECONE_ENVIRONMENT", "us-east-1")),
        pod_type="s1" 
    )

index = pc.Index(index_name)

#Embeddings
device = "cuda" if torch.cuda.is_available() else "cpu"

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": device},
    encode_kwargs={"batch_size": 64}
)

# Sparse Encoder
bm25 = BM25Encoder()

# Reranker
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# LLM
llm = ChatOllama(
    model=os.getenv("OLLAMA_MODEL", "mistral"),
    temperature=0,
    stream=False
)

#Request Schemas 
class ProcessRequest(BaseModel):
    video_id: str

class QueryRequest(BaseModel):
    video_id: str
    question: str

class ChatMessage(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    video_id: str
    question: str
    history: list[ChatMessage] | None = None


#Helpers 
def fetch_transcript(video_id: str) -> str:
    """Fetch transcript using RapidAPI"""
    conn = http.client.HTTPSConnection("youtube-transcript3.p.rapidapi.com")
    headers = {
        'x-rapidapi-key': os.getenv("RAPIDAPI_KEY"),
        'x-rapidapi-host': "youtube-transcript3.p.rapidapi.com"
    }
    endpoint_path = f"/api/transcript?videoId={video_id}"

    conn.request("GET", endpoint_path, headers=headers)
    res = conn.getresponse()
    data = res.read()

    if res.status >= 400:
        raise Exception(f"API request failed with status {res.status}: {data.decode('utf-8')}")

    transcript_data = json.loads(data.decode("utf-8"))

    transcript = ""
    if isinstance(transcript_data, dict) and "transcript" in transcript_data:
        if isinstance(transcript_data["transcript"], list):
            transcript = " ".join(
                item.get("text", "") for item in transcript_data["transcript"]
            )
        elif isinstance(transcript_data["transcript"], str):
            transcript = transcript_data["transcript"]
    elif isinstance(transcript_data, dict) and "body" in transcript_data:
        transcript = transcript_data["body"]
    elif isinstance(transcript_data, list):
        transcript = " ".join(
            item.get("text", "") for item in transcript_data if "text" in item
        )

    if not transcript.strip():
        raise ValueError(f"No transcript found for video ID: {video_id}")

    return transcript

def format_docs(docs: list[str]) -> str:
    return "\n\n".join(docs)

#Process Video 
def process_video(video_id: str):
    try:
        transcript = fetch_transcript(video_id)
        print(f"✅ Transcript length: {len(transcript)}")

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.split_text(transcript)

        # Fit BM25 on chunks
        bm25.fit(chunks)

        # Dense + Sparse embeddings
        dense_embs = embeddings.embed_documents(chunks)
        sparse_embs = bm25.encode_documents(chunks)

        vectors = []
        for i, text in enumerate(chunks):
            vectors.append({
                "id": f"{video_id}-{i}",
                "values": dense_embs[i],
                "sparse_values": sparse_embs[i],
                "metadata": {"text": text}
            })

        index.upsert(vectors, namespace=video_id)

        stats = index.describe_index_stats()
        print(f"📊 Index stats after insert: {json.dumps(stats, indent=2)}")

        print(f"✅ Stored {len(vectors)} chunks for video {video_id} (dense+sparse)")
        return {"status": "done", "video_id": video_id, "chunks": len(vectors)}

    except Exception as e:
        print(f"❌ Error processing {video_id}: {e}")
        return {"error": str(e)}

#API Routes 
@app.post("/process")
async def process_video_api(request: ProcessRequest):
    return process_video(request.video_id)

@app.post("/ask")
async def ask_video(request: QueryRequest):
    try:
        # Hybrid query
        dense_q = embeddings.embed_query(request.question)
        sparse_q = bm25.encode_queries([request.question])[0]

        print(f"🔍 Querying Pinecone in namespace={request.video_id}")
        results = index.query(
            vector=dense_q,
            sparse_vector=sparse_q,
            top_k=10,
            include_metadata=True,
            namespace=request.video_id
        )

        docs = [r["metadata"]["text"] for r in results.get("matches", [])]
        if not docs:
            return {"answer": "Transcript not available. Please process the video first."}

        # Rerank with CrossEncoder
        pairs = [(request.question, d) for d in docs]
        scores = reranker.predict(pairs)
        reranked = [doc for _, doc in sorted(zip(scores, docs), reverse=True)]

        top_docs = reranked[:4]
        context = format_docs(top_docs)

        # Keep only last 3 messages for context
        history_msgs = request.history or []
        history_msgs = history_msgs[-3:]
        history_formatted = "\n".join([f"{m.role.capitalize()}: {m.content}" for m in history_msgs])


        # LLM prompt
        prompt = f"""
        You are a helpful assistant.
        Use ONLY the transcript context below to answer.
        If the context doesn’t fully answer, still try to give the best possible response.

        Transcript:
        {context}

        Conversation History:
        {history_formatted}

        Question: {request.question}
        """
        answer = llm.invoke(prompt)
        return {"answer": answer.content}

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {"error": str(e)}
