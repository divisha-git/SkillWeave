# BYTS - Build Your Technical Skill

A complete web application for managing the BYTS Superpacc placement training program.

## Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (using Mongoose)
- **Authentication**: JWT (role-based access)

## Features

### Admin Features
- Add and manage BYTS Superpacc students
- Department-wise attendance management
- Upload alumni data via Excel files
- Comprehensive dashboard with statistics

### Student Features
- View profile with attendance percentage
- Team formation and management
- Post problem statements with duplication check
- Company attendance tracking and question posting
- Alumni interaction and messaging

### Alumni Features
- View messages from students
- Reply with guidance

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/byts
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Initial Setup

1. **Register Admin**: On first run, register an admin account through the login page (if register-admin endpoint is accessible) or create one directly in the database.

2. **Add Students**: Login as admin and add students through the admin dashboard.

3. **Upload Alumni**: Upload an Excel file with alumni data. The file should have columns:
   - Name
   - Company
   - Role
   - Year of passing
   - Email (optional)

4. **Mark Attendance**: Select department and date, then mark attendance for all students.

## Excel File Format for Alumni

The Excel file should have the following columns:
- **Name** (required)
- **Company** (required)
- **Role** or **Role at Company**
- **Year of passing** or **Year of Passing**
- **Email** (optional - will be auto-generated if not provided)

## API Endpoints

### Authentication
- `POST /api/auth/register-admin` - Register admin (first time only)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin Routes
- `GET /api/admin/dashboard` - Get dashboard statistics
- `POST /api/admin/students` - Add student
- `GET /api/admin/students` - Get all students
- `GET /api/admin/students/department/:department` - Get students by department
- `POST /api/admin/attendance` - Mark attendance
- `GET /api/admin/attendance/student/:studentId` - Get student attendance report
- `GET /api/admin/attendance/department/:department` - Get department attendance report
- `POST /api/admin/alumni/upload` - Upload alumni Excel file
- `GET /api/admin/alumni` - Get all alumni

### Student Routes
- `GET /api/student/profile` - Get student profile
- `GET /api/student/students` - Get all students
- `POST /api/student/teams` - Create team
- `GET /api/student/teams` - Get my teams
- `POST /api/student/teams/:teamId/invite` - Invite student to team
- `POST /api/student/teams/:teamId/invite/:inviteId` - Accept/reject invite
- `POST /api/student/problem-statements` - Post problem statement
- `GET /api/student/problem-statements` - Get my problem statements
- `POST /api/student/companies/attend` - Post company attendance
- `GET /api/student/companies` - Get all companies
- `GET /api/student/companies/search` - Search companies
- `GET /api/student/alumni/search` - Search alumni
- `POST /api/student/alumni/:alumniId/message` - Send message to alumni
- `GET /api/student/messages` - Get my messages

### Alumni Routes
- `GET /api/alumni/profile` - Get alumni profile
- `GET /api/alumni/messages` - Get messages
- `POST /api/alumni/messages/:messageId/reply` - Reply to message

## Project Structure

```
BYTS_HACK/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/     # Auth middleware
│   └── server.js       # Express server
├── src/
│   ├── components/     # React components
│   ├── context/         # React context (Auth)
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin pages
│   │   ├── student/     # Student pages
│   │   └── alumni/      # Alumni pages
│   ├── utils/           # Utility functions
│   └── App.jsx          # Main app component
└── package.json
```

## Notes

- The application uses JWT tokens stored in localStorage for authentication
- Alumni accounts are created automatically when Excel files are uploaded
- Attendance is marked department-wise and date-wise
- Problem statements are checked for similarity using text search
- Students can only be in one active team at a time

## License

This project is created for hackathon demonstration purposes.
