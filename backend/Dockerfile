FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Copy the rest of the source code
COPY . .

# Generate Prisma client for Linux inside the container
RUN npx prisma generate

# Expose the port
EXPOSE 3000

# Start the app
CMD [ "node", "dist/routes/index.js" ]
