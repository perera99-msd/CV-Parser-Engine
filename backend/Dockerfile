# backend/Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (optimizes Docker caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]