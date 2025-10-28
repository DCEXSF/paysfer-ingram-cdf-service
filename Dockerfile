# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose port (from env or default 8080)
ENV PORT=${PORT:-8080}
EXPOSE 8080

# Start the app
CMD ["npx", "functions-framework", "--target=processOrder"]
