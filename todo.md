# Exam System - Development Plan

## Design Guidelines

### Design References
- **Vercel Dashboard**: Clean, modern admin interfaces
- **Notion**: Minimalist, functional design
- **Style**: Modern Dark Mode + Professional Dashboard

### Color Palette
- Primary: #0A0A0A (Deep Black - background)
- Secondary: #1A1A1A (Charcoal - cards/sections)
- Accent: #3B82F6 (Blue - primary actions)
- Success: #10B981 (Green - success states)
- Warning: #F59E0B (Amber - warnings)
- Danger: #EF4444 (Red - delete/danger actions)
- Text: #FFFFFF (White), #9CA3AF (Gray - secondary text)

### Typography
- Heading1: Inter font-weight 700 (32px)
- Heading2: Inter font-weight 600 (24px)
- Heading3: Inter font-weight 600 (18px)
- Body: Inter font-weight 400 (14px)
- Body/Bold: Inter font-weight 600 (14px)

### Key Component Styles
- **Buttons**: Primary (blue), Secondary (gray), Danger (red), rounded-md, hover states
- **Cards**: Dark background with subtle borders, rounded-lg, shadow on hover
- **Forms**: Dark inputs with focus states, proper validation styling
- **Tables**: Striped rows, hover effects, responsive design

### Images to Generate
1. **hero-exam-dashboard.jpg** - Modern dashboard interface with charts and exam cards (Style: photorealistic, tech aesthetic)
2. **exam-taking-interface.jpg** - Clean exam interface showing multiple choice questions (Style: photorealistic, minimal)
3. **admin-panel-overview.jpg** - Professional admin dashboard with user management (Style: photorealistic, corporate)
4. **results-analytics.jpg** - Data visualization showing exam results and statistics (Style: photorealistic, modern)

---

## Development Tasks

### 1. Project Setup
- Initialize shadcn-ui template
- Install dependencies: axios, react-router-dom, jwt-decode
- Set up folder structure: /pages, /components, /utils, /api, /styles
- Configure API base URL

### 2. Authentication System
- Login.js - Email/password login with JWT
- Register.js - User registration (always as examinee)
- auth.js utility - Token management, role checking
- ProtectedRoute component - Role-based access control

### 3. Admin Dashboard
- AdminDashboard.js - Main admin interface
- UserManagement.js - CRUD for all users (admin, examiner, examinee)
- ExamManagement.js - View/edit/delete all exams
- AttemptDeletionRequests.js - Approve/reject deletion requests
- Search functionality for users and exams

### 4. Examiner Dashboard
- ExaminerDashboard.js - Main examiner interface
- MyExams.js - List of examiner's own exams
- CreateExam.js - Manual exam creation with question builder
- AIExamGenerator.js - AI-powered exam generation (specify question count)
- EditExam.js - Edit questions, change visibility (public/private)
- ExamVisibility.js - Select specific examinees for private exams
- ExamResults.js - View results for own exams only

### 5. Examinee Dashboard
- ExamineeDashboard.js - Main examinee interface
- AvailableExams.js - List of public + assigned private exams
- ExamSearch.js - Filter by exam name or examiner
- TakeExam.js - Exam taking interface with timer
- MyAttempts.js - View all attempt history and results
- RequestDeletion.js - Submit attempt deletion request with reason

### 6. Shared Components
- Navbar.js - Role-based navigation menu
- ProtectedRoute.js - Route wrapper with role checking
- PopupHost.jsx - Centralized popup/notification system
- LoadingSpinner.js - Loading state component
- ErrorBoundary.js - Error handling wrapper

### 7. Backend Integration
- api.js - Axios instance with interceptors
- authAPI.js - Login, register endpoints
- adminAPI.js - Admin-specific endpoints
- examinerAPI.js - Examiner-specific endpoints
- examineeAPI.js - Examinee-specific endpoints
- aiAPI.js - AI exam generation endpoint

### 8. Styling and UX
- Global styles with dark theme
- Responsive design for mobile/tablet/desktop
- Loading states for all async operations
- Error handling with user-friendly messages
- Success notifications for actions
- Smooth transitions and animations