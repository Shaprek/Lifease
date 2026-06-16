const express = require('express');

function createStatsRouter(collection) {
    const router = express.Router();

    // GET /api/stats
    router.get('/', async (_req, res) => {
        try {
            const pipeline = [
                {
                    $group: {
                        _id: null,
                        totalConversations: { $sum: 1 },
                        totalQuestionChars: { $sum: { $strLenCP: { $ifNull: ['$question', ''] } } },
                        latestConversation: { $max: '$createdAt' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalConversations: 1,
                        totalQuestions: '$totalConversations',
                        avgQuestionLength: {
                            $cond: [
                                { $eq: ['$totalConversations', 0] },
                                0,
                                { $divide: ['$totalQuestionChars', '$totalConversations'] },
                            ],
                        },
                        latestConversationTimestamp: '$latestConversation',
                    },
                },
            ];

            const result = await collection.aggregate(pipeline).toArray();
            const stats = result[0] || {
                totalConversations: 0,
                totalQuestions: 0,
                avgQuestionLength: 0,
                latestConversationTimestamp: null,
            };

            return res.json({ success: true, stats });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Failed to compute stats', error: error.message });
        }
    });

    return router;
}

module.exports = { createStatsRouter };
