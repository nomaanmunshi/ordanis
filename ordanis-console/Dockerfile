FROM node:22-alpine AS build
WORKDIR /app
COPY ordanis-console/package*.json ./
RUN npm install --no-audit --no-fund
COPY ordanis-console/ ./
ARG VITE_DATA_MODE=showcase
ARG VITE_API_BASE_URL=/api
ENV VITE_DATA_MODE=$VITE_DATA_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY ordanis-console/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
