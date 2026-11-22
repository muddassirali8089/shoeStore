FROM node:20-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your server code
COPY . .

# Expose the port your server runs on
EXPOSE 8000

# Start the server
CMD ["node", "index.js"]