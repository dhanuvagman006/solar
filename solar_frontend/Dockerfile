FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Vite requires the --host flag to expose the port to Docker
CMD ["npm", "run", "dev", "--", "--host"]
