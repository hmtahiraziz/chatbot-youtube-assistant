# YouTube Chatbot – Ask Anything About a Video

An AI-powered chatbot that takes a YouTube video ID, extracts the transcript, and answers your questions directly from the video content.

---

## Key Features
- Ask any question about a YouTube video
- Get summaries in bullet points
- Explain technical terms in simple words
- Built with LangChain + LLMs for smart Q&A

---

## How It Works
1. Enter a YouTube video ID
2. The chatbot fetches the video transcript
3. Ask questions in natural language
4. Get context-aware answers instantly

---

## Example Questions You Can Ask
- “Summarize this video in 5 points”
- “What are the key takeaways?”

---

## Chatbot UI
<img width="1898" alt="Screenshot1" src="https://github.com/user-attachments/assets/4001873f-66d5-4897-b0b2-58955e7ee8cb" />

<img width="1886" alt="Screenshot2" src="https://github.com/user-attachments/assets/35a7a760-10f2-428f-911f-798c1cc607f7" />

---

## Getting Started
# Clone the repo
git clone https://github.com/hmtahiraziz/chatbot-youtube-assistant.git

# Backend
cd FAQ

# Install dependencies
pip install -r requirements.txt

# Run the backend
uvicorn faq_bot:app --reload

---

# Frontend
cd Faq_Frontend

# Install dependencies
npm install

# Run the frontend
npm run dev

---
