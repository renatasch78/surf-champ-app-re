Surf Champ - Auth Upgrade (Spring Security + JWT)
================================================

What's included:
- backend/ (Spring Boot) with User entity, JWT, Spring Security, /api/auth endpoints:
  - POST /api/auth/register  { username, password, role? }
  - POST /api/auth/login     { username, password } -> returns { token }

- backend_proxy/ (Node.js) updated to forward /proxy/auth/* to backend and pass Authorization header for proxied requests.
- frontend/ (React) simple Login/Register/Dashboard pages calling proxy endpoints.

How to run:
1) Create DB if not exists:
   CREATE DATABASE surf_champ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

2) Update backend/src/main/resources/application.properties with DB credentials and set a strong jwt.secret.

3) Start backend (Spring Boot):
   mvn -f backend/pom.xml spring-boot:run

4) Start proxy:
   cd backend_proxy
   npm install
   node index.js

5) Start frontend:
   cd frontend
   npm install
   npm run dev  (if using vite setup)

Notes:
- Passwords are hashed with BCrypt.
- JWT expiration configured in application.properties (jwt.expiration-ms).
- For production, secure the jwt.secret and use HTTPS.
