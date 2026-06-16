const { getAIResponse } = require('../services/aiService');
const Conversation = require('../models/Conversation');

async function askQuestion(req, res) {
    try {
        const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Question is required.',
            });
        }

        const answer = await getAIResponse(question);

        if (!answer || !answer.trim()) {
            return res.status(500).json({
                success: false,
                message: 'Gemini returned an empty response.',
            });
        }

        let conversation;

        try {
            conversation = await Conversation.create({
                question,
                answer,
            });
        } catch (saveError) {
            if (saveError.name === 'ValidationError') {
                return res.status(500).json({
                    success: false,
                    message: 'Conversation validation failed before save.',
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to save conversation to MongoDB.',
            });
        }

        return res.status(200).json({
            success: true,
            answer,
            conversation: {
                _id: conversation._id,
                question: conversation.question,
                answer: conversation.answer,
                timestamp: conversation.timestamp,
            },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message =
            statusCode === 400
                ? error.message
                : statusCode === 500 && error.message === 'GEMINI_API_KEY is missing from environment variables.'
                    ? error.message
                    : error.message || 'Internal server error.';

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}

async function getConversations(_req, res) {
    try {
        const page = Number.parseInt(_req.query.page, 10);
        const limit = Number.parseInt(_req.query.limit, 10);

        if ((_req.query.page && (!Number.isInteger(page) || page < 1)) || (_req.query.limit && (!Number.isInteger(limit) || limit < 1))) {
            return res.status(400).json({
                success: false,
                message: 'Page and limit must be positive integers.',
            });
        }

        const currentPage = Number.isInteger(page) ? page : 1;
        const pageSize = Number.isInteger(limit) ? Math.min(limit, 100) : 10;
        const skip = (currentPage - 1) * pageSize;

        // Sorting by timestamp keeps the newest messages first, which is the
        // most useful order for chat history screens and conversation review.
        // Chat history APIs are valuable because they let clients reload past
        // context, support search, and provide auditability for assistant replies.
        // For large datasets, pagination prevents the API from returning the
        // entire collection at once and keeps query response times predictable.
        const [totalCount, conversations] = await Promise.all([
            Conversation.countDocuments(),
            Conversation.find()
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean()
        ]);

        // lean() avoids hydrating full Mongoose documents, which is a useful
        // performance optimization when returning larger history datasets.
        return res.status(200).json({
            success: true,
            count: conversations.length,
            conversations,
            pagination: {
                page: currentPage,
                limit: pageSize,
                totalCount,
                totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch conversation history.',
        });
    }
}

module.exports = { askQuestion, getConversations };