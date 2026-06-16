import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
    headers: {
        'Content-Type': 'application/json',
    },
});

export async function sendQuestion(question) {
    const response = await api.post('/api/conversations', { question });
    return response.data;
}

export async function getConversations() {
    const response = await api.get('/api/conversations');
    return response.data;
}

export async function getStats() {
    const response = await api.get('/api/stats');
    return response.data;
}

export async function searchConversations(q) {
    const response = await api.get('/api/conversations/search', { params: { q } });
    return response.data;
}