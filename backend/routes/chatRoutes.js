const express = require('express');
const { askQuestion, getConversations } = require('../controllers/chatController');

const router = express.Router();

router.post('/chat', askQuestion);
router.get('/conversations', getConversations);

module.exports = router;