FROM node:20-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your server code
COPY . .

# Expose the port your server runs on (I see 8000 in your previous compose file)
EXPOSE 8000

# Start the server (use your actual start command)
CMD ["node", "index.js"]