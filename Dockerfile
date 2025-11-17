# Use official Node
FROM node:18

# Create working directory
WORKDIR /app

# Copy package files first (better cache)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose internal app port
EXPOSE 3001

# Start the engine
CMD ["npm", "start"]
