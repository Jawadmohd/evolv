# EVOLV

EVOLV is a React Native learning and habit-tracking app backed by Spring Boot and PostgreSQL.

## Run locally

1. Create a PostgreSQL database named `evolv`. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and a strong `JWT_SECRET` for the backend. Flyway applies the schema when the backend starts.
2. From `backend`, run `./mvnw spring-boot:run`.
3. From `frontend`, run `npm ci`. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to a backend address reachable from your device, including `/api/v1`. Android emulators can use `http://10.0.2.2:8080/api/v1`. Physical devices can use the development computer's LAN address.
4. From `frontend`, run `npm start`.

Set `YOUTUBE_API_KEY` on the server for video recommendations. Start Ollama and install the configured `OLLAMA_MODEL` (default `llama3.2`) for the study assistant. Set `OLLAMA_URL` if Ollama runs on another host. Google sign-in requires matching frontend and backend Google client IDs.

The included quizzes and quotes are a starter catalog. The original MongoDB records are outside this repository. Challenge owners can opt into sharing the title and status to the authenticated feed. Recognized durations such as “30 days” determine when a challenge leaves the feed. Its owner retains the history.
