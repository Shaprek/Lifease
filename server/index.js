const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');
const { MongoClient } = require('mongodb');
const { createConversationRouter } = require('./routes/conversations');
const { getAIResponse } = require('../backend/services/aiService');
const path = require('path');

dotenv.config({
    path: path.resolve(__dirname, '../.env'),
    override: true,
});

const app = express();
const port = process.env.PORT || 5001;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DB_NAME || 'lifease_faq_assistant';
const defaultCorsOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const envCorsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];
const allowedCorsOrigins = [...new Set([...defaultCorsOrigins, ...envCorsOrigins])];

console.log('Allowed CORS origins:', allowedCorsOrigins);

if (mongoUri.startsWith('mongodb+srv://')) {
    const dnsServers = (process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

    if (dnsServers.length > 0) {
        dns.setServers(dnsServers);
        console.log('Mongo DNS servers =', dnsServers.join(', '));
    }
}

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedCorsOrigins.includes(origin) || allowedCorsOrigins.includes('*')) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin ${origin}`));
    },
}));
app.use(express.json({ limit: '1mb' }));

console.log('__dirname =', __dirname);
console.log('Loaded URI =', process.env.MONGODB_URI);

const client = new MongoClient(mongoUri);
let conversationsCollection;

async function connectDatabase() {
    if (conversationsCollection) {
        return conversationsCollection;
    }

    await client.connect();
    const database = client.db(databaseName);
    conversationsCollection = database.collection('conversations');
    await conversationsCollection.createIndex({ question: 'text', answer: 'text', createdAt: -1 });
    await conversationsCollection.createIndex({ createdAt: -1 });
    return conversationsCollection;
}

async function buildAssistantReply(question) {
    if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
        try {
            const answer = await getAIResponse(question);
            if (answer) return answer;
        } catch (error) {
            console.error('AI service error:', error.message);
        }
    }

    const normalizedQuestion = question.toLowerCase();

    if (normalizedQuestion.includes('install') || normalizedQuestion.includes('setup')) {
        return 'To run this project, install dependencies with npm install, set MONGODB_URI and OPENAI_API_KEY in .env.local, then start the app with npm run dev.';
    }

    if (normalizedQuestion.includes('mongodb') || normalizedQuestion.includes('database')) {
        return 'Questions and answers are stored in MongoDB in a conversations collection, along with timestamps and a search-friendly lowercase question field.';
    }

    if (normalizedQuestion.includes('stream')) {
        return 'Streaming can be added by switching the answer endpoint to Server-Sent Events or the OpenAI streaming API. The current implementation sends a complete response for simplicity.';
    }

    if (normalizedQuestion.includes('search')) {
        return 'Conversation search is supported by querying the stored conversations with a case-insensitive question filter.';
    }

    return `I understand your question about ${question.trim().replace(/\s+/g, ' ')}. In a production build, this server would forward the prompt to OpenAI, Gemini, Claude, or OpenRouter and return the model response.`;
}

async function registerRoutes() {
    console.log('MONGO URI:', process.env.MONGODB_URI);
    const collection = await connectDatabase();
    const conversationRouter = createConversationRouter(collection, buildAssistantReply);
    app.use('/api/conversations', conversationRouter);
    app.use('/api/chat', conversationRouter);
    // Stats endpoint
    const { createStatsRouter } = require('./routes/stats');
    app.use('/api/stats', createStatsRouter(collection));

    app.get('/api/health', (_req, res) => {
        res.json({ ok: true, service: 'lifease-faq-assistant-api' });
    });

    app.listen(port, () => {
        console.log(`API server listening on http://localhost:${port}`);
    });
}

registerRoutes().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
});
