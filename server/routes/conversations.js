const { ObjectId } = require('mongodb');
const express = require('express');

function createConversationRouter(collection, buildAssistantReply) {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
            const limit = Math.min(Number(req.query.limit) || 50, 100);
            const query = search
                ? {
                    $or: [
                        { question: { $regex: search, $options: 'i' } },
                        { answer: { $regex: search, $options: 'i' } },
                    ],
                }
                : {};

            const conversations = await collection
                .find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            res.json({ success: true, conversations });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch conversations', error: error.message });
        }
    });

    // Search conversations by keyword across question and answer fields.
    // Example: GET /api/conversations/search?q=install
    router.get('/search', async (req, res) => {
        try {
            const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

            if (!q) {
                return res.status(200).json({ success: true, count: 0, conversations: [] });
            }

            const query = {
                $or: [
                    { question: { $regex: q, $options: 'i' } },
                    { answer: { $regex: q, $options: 'i' } },
                ],
            };

            const conversations = await collection.find(query).sort({ createdAt: -1 }).toArray();

            return res.status(200).json({ success: true, count: conversations.length, conversations });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Search failed', error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const question = typeof req.body.question === 'string' ? req.body.question.trim() : '';

            if (!question) {
                return res.status(400).json({ message: 'Question is required.' });
            }

            const answer = await buildAssistantReply(question);
            const createdAt = new Date();
            const conversation = {
                question,
                answer,
                questionLower: question.toLowerCase(),
                createdAt,
            };

            const result = await collection.insertOne(conversation);
            res.status(201).json({
                success: true,
                answer,
                conversation: {
                    _id: result.insertedId,
                    ...conversation,
                },
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to save conversation', error: error.message });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'Invalid conversation id.' });
            }

            const conversation = await collection.findOne({ _id: new ObjectId(req.params.id) });
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found.' });
            }

            res.json({ success: true, conversation });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch conversation', error: error.message });
        }
    });

    return router;
}

module.exports = { createConversationRouter };
