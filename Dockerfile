# Liho - Docker
FROM node:22-alpine
WORKDIR /app
COPY dist ./
RUN npm install
EXPOSE 4010
CMD ["npm", "start"]
