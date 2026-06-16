Docker quick start

1. Copy environment file and fill required values:

```bash
cp .env.example .env
# edit .env and provide GEMINI_API_KEY
```

2. Build and start everything (this builds frontend, backend, and runs MongoDB):

```bash
docker-compose up --build
```

3. Visit the app:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api

Notes
- The backend is configured to connect to MongoDB at `mongodb://mongo:27017` inside the compose network.
- `GEMINI_API_KEY` must be set in your `.env` (or exported in your shell) for the AI service to work; otherwise the backend will throw an error when handling requests.
- To run only the backend and MongoDB: `docker-compose up --build backend mongo`
- To stop and remove containers: `docker-compose down`
