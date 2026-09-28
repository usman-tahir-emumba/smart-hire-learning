FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY node_modules ./node_modules
COPY dist ./dist
EXPOSE 8000
CMD ["node", "dist/server.js"]
