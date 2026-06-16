const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');

const geminiModelName = 'gemini-1.5-flash';

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
}

function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return new OpenAI({ apiKey });
}

async function getGeminiResponse(question) {
    try {
        const client = getGeminiClient();
        if (!client) return null;
        const model = client.getGenerativeModel({ model: geminiModelName });
        const result = await model.generateContent(question);
        const response = await result.response;
        const text = response.text();
        return typeof text === 'string' ? text.trim() : '';
    } catch (error) {
        console.error('Gemini error:', error.message);
        return null;
    }
}

async function getOpenAIResponse(question) {
    try {
        const client = getOpenAIClient();
        if (!client) return null;
        const response = await client.responses.create({
            model: 'gpt-4o-mini',
            input: question,
        });
        const text = response.output_text || '';
        return typeof text === 'string' ? text.trim() : '';
    } catch (error) {
        console.error('OpenAI error:', error.message);
        return null;
    }
}

async function getAIResponse(question) {
    const normalizedQuestion = typeof question === 'string' ? question.trim() : '';

    if (!normalizedQuestion) {
        const error = new Error('Question is required.');
        error.statusCode = 400;
        throw error;
    }

    try {
        // Try Gemini first
        let answer = await getGeminiResponse(normalizedQuestion);
        if (answer) return answer;

        // Fall back to OpenAI
        answer = await getOpenAIResponse(normalizedQuestion);
        if (answer) return answer;

        // If both fail, return null so backend can use placeholder
        return null;
    } catch (error) {
        if (error.statusCode) throw error;
        const wrappedError = new Error('AI request failed.');
        wrappedError.statusCode = 500;
        wrappedError.cause = error;
        throw wrappedError;
    }
}

module.exports = { getAIResponse };