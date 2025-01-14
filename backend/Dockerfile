FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create model storage directory
RUN mkdir -p /app/models

# Create data directory for GMU data
RUN mkdir -p /app/data/gmu

EXPOSE 4000

CMD ["npm", "start"]
