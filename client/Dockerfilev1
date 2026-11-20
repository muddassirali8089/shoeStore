FROM node:20-alpine
WORKDIR /app

# 1. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy the source code
COPY . .

# 3. Expose Vite's default port
EXPOSE 3000

# 4. Run the Vite development server
# We add --host so it can be accessed outside the Docker container
CMD ["npm", "run", "dev", "--", "--host"]