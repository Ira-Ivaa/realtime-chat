# Real-time Chat

Многопользовательский чат в реальном времени: регистрация и вход по JWT, создание чатов, приглашение участников и обмен сообщениями по WebSocket. Бэкенд — Node.js/Express + SQLite, фронтенд — на чистом JavaScript.

## Возможности

- Регистрация и вход (JWT, пароли хешируются bcrypt)
- Создание, переименование и удаление своих чатов
- Подключение к чату по ID и приглашение участника по email
- Обмен сообщениями в реальном времени (WebSocket)
- Редактирование и удаление своих сообщений
- История сообщений сохраняется и подгружается после перезагрузки

## Стек

- Node.js, Express 5
- WebSocket — `ws`
- SQLite — `sqlite3`
- Аутентификация — `jsonwebtoken`, `bcryptjs`
- Валидация — `joi`
- Фронтенд — ванильный HTML/CSS/JS

## Требования

- Node.js 18+

## Установка и запуск

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd Chat

# 2. Установить зависимости
npm install

# 3. Создать .env из шаблона и задать свой секрет
cp .env.example .env
# затем открыть .env и заменить JWT_SECRET на случайную строку

# 4. Запуск
npm run dev     # разработка (nodemon, автоперезапуск)
# или
npm start       # обычный запуск
```

Открыть в браузере: http://localhost:3000

## Переменные окружения

| Переменная       | Описание                            | Пример                   |
| ---------------- | ----------------------------------- | ------------------------ |
| `PORT`           | порт сервера                        | `3000`                   |
| `DB_PATH`        | путь к файлу SQLite                 | `./database/chats.db`    |
| `JWT_SECRET`     | секрет для подписи JWT (обязателен) | случайная длинная строка |
| `JWT_EXPIRES_IN` | срок жизни токена                   | `7d`                     |

Папка `database/` создаётся автоматически при первом запуске.

## Docker

```bash
docker build -t chat .
docker run -p 3000:3000 --env-file .env chat
```

## Структура проекта

```
src/
  config/      env и подключение/схема БД
  controllers/ auth, chats, messages
  middleware/  protect (JWT), validate (Joi), errorHandler, notFound
  routes/      auth, chats, message
  services/    запросы к БД (chats, messages)
  utils/       jwt
  server.js    точка входа (HTTP + WebSocket)
public/        фронтенд (index.html, script.js, style.css)
```

## API (кратко)

| Метод  | Путь                                     | Описание             |
| ------ | ---------------------------------------- | -------------------- |
| POST   | `/api/auth/register`                     | регистрация          |
| POST   | `/api/auth/login`                        | вход                 |
| GET    | `/api/auth/me`                           | текущий пользователь |
| GET    | `/api/chats`                             | список своих чатов   |
| POST   | `/api/chats`                             | создать чат          |
| PATCH  | `/api/chats/:id/update`                  | переименовать        |
| DELETE | `/api/chats/:id/delete`                  | удалить              |
| POST   | `/api/chats/:id/join`                    | вступить по ID       |
| POST   | `/api/chats/:id/invite`                  | пригласить по email  |
| GET    | `/api/message/:chatId/receive`           | история сообщений    |
| POST   | `/api/message/:chatId/send`              | отправить            |
| PATCH  | `/api/message/:chatId/:messageId/update` | изменить             |
| DELETE | `/api/message/:chatId/:messageId/delete` | удалить              |

## Ограничения (учебный проект)

- В чат можно вступить, зная его числовой ID — закрытых/приватных чатов нет.
- CORS открыт для всех источников.
