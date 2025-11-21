# Use Node 18 (CommonJS-compatible)
FROM node:18

# Create app directory
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Use Render’s assigned port
ENV PORT=3001

# Expose the same port your app uses
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
