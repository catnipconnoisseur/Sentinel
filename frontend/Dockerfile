FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build the app
COPY . .
# We need to build with the backend URL set to the API container if running via compose,
# but usually Vite builds inject env vars at build time.
# For this hackathon, we might proxy requests via nginx or use a relative path if they are on the same domain.
# Since we use a hardcoded VITE_API_BASE_URL=http://localhost:8000 in .env for local dev, 
# for docker-compose we'll pass it as an argument or just rely on relative paths if we set up nginx properly.
# Let's assume the frontend will make requests to http://localhost:8000 for local docker-compose for simplicity.
RUN npm run build

FROM nginx:alpine
# Copy the built output
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
