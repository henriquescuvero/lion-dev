FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_CLAUDE_API_KEY=sk-cliproxy-2024-secure
ARG VITE_CLAUDE_API_URL=https://claude-api-proxy.st3er3.easypanel.host/v1

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_CLAUDE_API_KEY=$VITE_CLAUDE_API_KEY
ENV VITE_CLAUDE_API_URL=$VITE_CLAUDE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
