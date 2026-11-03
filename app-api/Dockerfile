FROM node:24-slim

# ffmpeg is used to generate video thumbnails (src/uploads/storage/thumbnail.ts).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY migrations ./migrations
COPY src ./src

USER node
EXPOSE 4000

CMD ["node", "--import", "./src/instrumentation.ts", "src/index.ts"]
