# How to Run the Application

This guide provides simple instructions on how to run the Scan&Serve application locally.

## Prerequisites

- Node.js (v14 or later) for the main application
- Node.js (v10 or later) for the tools directory
- npm or pnpm
- Firebase CLI (`npm install -g firebase-tools`)

## Running the Application

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install web dependencies
cd web
npm install
cd ..

# Install functions dependencies
cd functions
npm install
cd ..
```

### 2. Set Up Environment Variables

```bash

# Copy the example env file
cp web/.env.example web/.env

# Edit the .env file with your Firebase configuration
```

### 3. Start the Firebase Emulators (Java 11 or more)

```bash
firebase emulators:start
```

### 4. Start the Web Application

In a separate terminal:

```bash
cd web
npm run dev
```

### 5. Access the Application

- Client: http://localhost:5173/menu?rid=R123&table=T7
- Admin: http://localhost:5173/admin

---

# Как да стартирате приложението

Това ръководство предоставя прости инструкции за локално стартиране на приложението Scan&Serve.

## Предварителни изисквания

- Node.js (v14 или по-нова версия) за основното приложение
- Node.js (v10 или по-нова версия) за директорията tools
- npm или pnpm
- Firebase CLI (`npm install -g firebase-tools`)

## Стартиране на приложението

### 1. Инсталиране на зависимостите

```bash
# Инсталиране на основните зависимости
npm install

# Инсталиране на зависимостите за web
cd web
npm install
cd ..

# Инсталиране на зависимостите за functions
cd functions
npm install
cd ..
```

### 2. Настройка на променливите на средата

```bash
# Уверете се, че сте в основната директория на проекта
cd ~/ss/projects/ScanNServe

# Копирайте примерния env файл
cp web/.env.example web/.env

# Редактирайте .env файла с вашата Firebase конфигурация
```

### 3. Стартиране на Firebase емулаторите

```bash
firebase emulators:start
```

### 4. Стартиране на уеб приложението

В отделен терминал:

```bash
cd web
npm run dev
```

### 5. Достъп до приложението

- Клиент: http://localhost:5173/menu?rid=R123&table=T7
- Админ: http://localhost:5173/admin
