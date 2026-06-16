This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
# Lifease FAQ Assistant

Full-stack AI-powered FAQ assistant built for the developer intern assessment.

## Stack

- Next.js App Router frontend
- Express.js API server
- MongoDB conversation storage
- Provider-ready AI adapter layer

## Features

- Ask a question and receive an AI-style response
- Save question, answer, and timestamp in MongoDB
- Fetch previous conversations from the API
- Search stored conversations
- Dark mode interface

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```bash
copy .env.example .env.local
```

3. Update `.env.local` with your MongoDB connection string and AI provider key.

4. Start both the frontend and backend:

```bash
npm run dev
```

The app runs the Next.js frontend on `http://localhost:3000` and the Express API on `http://localhost:5001`.

## API

- `GET /api/health`
- `GET /api/conversations?search=term`
- `POST /api/conversations`
- `POST /api/chat`

## Gemini Setup

Install the Gemini SDK:

```bash
npm install @google/generative-ai
```

Add this to your environment file:

```bash
GEMINI_API_KEY=your_api_key
```

The Gemini route is implemented under `backend/services/aiService.js`, `backend/controllers/chatController.js`, and `backend/routes/chatRoutes.js`.

## Postman Example

Request:

```http
POST /api/chat
Content-Type: application/json
```

Body:

```json
{
	"question": "What is React?"
}
```

Expected response:

```json
{
	"success": true,
	"answer": "React is a JavaScript library for building user interfaces..."
}
```

## Notes

- The current implementation uses a deterministic server-side response so the assessment is runnable without a live AI provider.
- You can swap `buildAssistantReply` in `server/index.js` for OpenAI, Gemini, Claude, or OpenRouter.
