# Online Exam System

A full-stack Online Exam System developed using **React** for the frontend and **Node.js (Express)** with **Microsoft SQL Server** for the backend.  
The system supports multiple user roles (Admin, Teacher, Student), exam creation, question management, result storage, and AI-based question generation.

---


## Features

- User authentication (Admin, Teacher, Student)
- Exam creation and publishing
- Question management (manual and AI-generated)
- Student exam attempts
- Exam result storage
- Admin user management
- Google Generative AI integration for MCQ generation

---

## Tech Stack

### Frontend
- React
- React Router
- Axios

### Backend
- Node.js
- Express
- Microsoft SQL Server
- mssql (msnodesqlv8)
- dotenv
- Google Generative AI API

---

## Prerequisites

Make sure the following are installed:

- Node.js (LTS recommended)
- npm
- Microsoft SQL Server
- SQL Server Management Studio (SSMS)
- Git

---

## Database Setup

1. Open **SQL Server Management Studio**.
2. Create a database named:

```sql
CREATE DATABASE ExamSystemDB;
```

3. Run the provided SQL script (`database.sql`) to create:
   - Users
   - Exams
   - Questions
   - ExamResults  

The backend assumes the database and tables already exist.

---

## Backend Setup

1. Navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file inside the `backend` folder:

```env
PORT=5000
NODE_ENV=development

DB_DRIVER=ODBC Driver 17 for SQL Server
DB_NAME=ExamSystemDB
DB_TRUSTED_CONNECTION=yes
DB_TRUST_CERT=yes

DB_SERVER_LOCAL=
DB_SERVER_FRIEND=

GOOGLE_API_KEY=your_google_api_key_here
```

4. Start the backend server:

```bash
npm run start
```

Backend runs at:

```
http://localhost:5000
```

---

## Frontend Setup

1. Navigate to the root (frontend) folder:

```bash
cd .
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend application:

```bash
npm run start
```

Frontend runs at:

```
http://localhost:3000
```

---

## Running the Project

Both servers must be running at the same time:

- Backend → `npm run start` (inside `backend`)
- Frontend → `npm run start` (inside root)

---

## Environment Variables & Security

- Sensitive data is stored in `.env`

---

## Development Notes

- Backend supports multiple SQL Server machines using environment variables
- React frontend uses the built-in development server with hot reload
- Backend can optionally be run with nodemon during development

---

## Common Issues

- Ensure SQL Server service is running
- Verify correct SQL Server instance name
- Run `npm install` in both frontend and backend folders
- Do not run Git commands outside the repository root

---

## License

This project is intended for educational and demonstration purposes.