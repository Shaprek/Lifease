const mongoose = require('mongoose');

// This schema keeps the document shape explicit so every saved chat has the
// same fields and can be validated before it reaches the database.
const conversationSchema = new mongoose.Schema(
    {
        // Mongoose validation makes sure empty questions are rejected before save.
        question: {
            type: String,
            required: [true, 'Question is required.'],
            trim: true,
        },
        // The answer is required so each stored record always contains the model reply.
        answer: {
            type: String,
            required: [true, 'Answer is required.'],
            trim: true,
        },
        // A dedicated timestamp field is useful when you want a predictable API
        // response shape and a sortable creation time without relying on Mongoose's
        // automatic `createdAt` / `updatedAt` pair.
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
    }
);

// The model gives us a clean abstraction for CRUD operations and lets Mongoose
// handle casting, validation, and document creation for us.
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;