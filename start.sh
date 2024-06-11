export $(cat .env | xargs) && deno run --allow-env --allow-net --allow-read=judger.proto src/main.ts
