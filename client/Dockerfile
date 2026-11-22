# --- STAGE 1: Build the App ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- STAGE 2: Serve the App ---
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve

# ✅ FIXED: Changed 'builder' to 'build' to match Stage 1
COPY --from=build /app/dist ./dist 

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]