const DEFAULT_BASE_URL = 'http://localhost:5001';

function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;
}

async function request(path, options = {}) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

export function fetchConversations(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/conversations${query}`);
}

export function sendQuestion(question) {
    return request('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ question }),
    });
}
