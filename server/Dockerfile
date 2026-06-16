FROM node:18-alpine
WORKDIR /usr/src/app
# Copy root package.json so dependencies install correctly
COPY package.json ./package.json
COPY package-lock.json* ./package-lock.json
COPY server ./server
COPY backend ./backend
RUN npm install --production --silent
ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001
CMD ["node", "server/index.js"]
