# 🍺 Ecosistema Digital AMSTEL WebAR

Este repositorio contiene la arquitectura completa para la experiencia nacional de Realidad Aumentada de Amstel.

## 🏗️ Estructura del Proyecto

- `/backend`: API REST construida con PHP 8.3 + Slim Framework 4.
- `/frontend`: Panel Administrativo (CMS) y Dashboard de métricas construido con React + Vite.
- `/database`: Esquema SQL y scripts de prueba para la base de datos MySQL.
- `/webar`: (En desarrollo) Experiencia de Realidad Aumentada.

---

## 🚀 Guía de Configuración Local

### 1. Base de Datos (MySQL)
1. Inicia tus servicios de MySQL (recomendado usar **Laragon** o **XAMPP**).
2. Crea una base de datos llamada `amstel_webar`.
3. Importa el archivo `/database/schema.sql` (puedes usar HeidiSQL o phpMyAdmin).

### 2. Backend (PHP API)
1. Asegúrate de tener **Composer** instalado.
2. Ve a la carpeta del backend e instala las dependencias:
   ```bash
   cd backend
   composer install
   ```
3. Inicia el servidor del backend (Puerto 8001):
   ```bash
   php -S localhost:8001 -t public
   ```
   *Nota: Puedes validar la conexión en `http://localhost:8001/api/ping`*

### 3. Frontend (Panel Admin)
1. Ve a la carpeta del frontend e instala las dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Inicia el servidor de desarrollo (Puerto 5173):
   ```bash
   npm run dev
   ```
3. Accede a `http://localhost:5173`
   * **Usuario:** `admin@amstel.ec`
   * **Contraseña:** `admin123`

---

## 📊 Estado del Proyecto

| Fase | Estado | Descripción |
|------|--------|-------------|
| **Fase 1: Base de Datos** | ✅ Completada | Esquema SQL y Seeds (4 estadios) |
| **Fase 2: Backend API** | ✅ Completada | Slim 4 + JWT + Analytics |
| **Fase 3: Frontend CMS** | ✅ Completada | React Admin + Dashboard de métricas |
| **Fase 4: Landing Page** | ⏳ Próximamente | Muro de videos dinámico |
| **Fase 5: WebAR National** | ⏳ Próximamente | Soporte Multi-marker (4 estadios) |

---

## 🛠️ Requisitos Técnicos
- PHP >= 8.1
- MySQL >= 8.0
- Node.js >= 18
- Composer
