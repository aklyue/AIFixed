# Этап сборки
FROM node:22-alpine AS build

WORKDIR /app

# Копируем файлы package.json и package-lock.json.
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап production
FROM nginx:alpine

# Копируем собранное приложение из этапа сборки
COPY --from=build /app/build /usr/share/nginx/html

# Настраиваем nginx
COPY prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"] 