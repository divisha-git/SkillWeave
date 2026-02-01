# BYTS - Quick Start Guide

## Prerequisites
- Node.js (v16 or higher)
- MongoDB running locally or MongoDB Atlas connection string
- npm or yarn

## Setup Steps

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/byts
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd ..  # Go back to root
npm install
```

Create a `.env` file in the root directory:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Initial Setup

1. **Register Admin** (First Time Only)
   - Open the application in your browser
   - Use the register-admin endpoint or create admin directly in database
   - For demo: You can use Postman/Thunder Client to POST to `/api/auth/register-admin` with:
     ```json
     {
       "name": "Admin",
       "email": "admin@byts.com",
       "password": "admin123"
     }
     ```

2. **Login as Admin**
   - Use the admin credentials to login
   - You'll be redirected to the admin dashboard

3. **Add Students**
   - Go to "Manage Students" from the dashboard
   - Click "Add Student"
   - Fill in student details (Name, Email, Student ID, Department, Year)
   - Students can login with their email (password optional for demo)

4. **Upload Alumni Data**
   - Go to "Upload Alumni" from the dashboard
   - Prepare an Excel file with columns:
     - Name (required)
     - Company (required)
     - Role or Role at Company
     - Year of passing or Year of Passing
     - Email (optional - auto-generated if missing)
   - Upload the file
   - Alumni accounts are created automatically

5. **Mark Attendance**
   - Go to "Mark Attendance"
   - Select Department
   - Select Date
   - Mark Present/Absent for each student
   - Click "Mark Attendance"

## User Roles

### Admin
- Full access to all features
- Can add students, mark attendance, upload alumni
- View comprehensive dashboard

### Student
- View profile with attendance percentage
- Create and manage teams
- Post problem statements
- Track company attendance and post questions
- Search and contact alumni

### Alumni
- View messages from students
- Reply with guidance
- Cannot edit attendance or access admin features

## Features Overview

### Admin Features
- ✅ Add BYTS Superpacc Students
- ✅ Department-wise Attendance Management
- ✅ Excel Upload for Alumni Data
- ✅ Comprehensive Dashboard with Statistics

### Student Features
- ✅ View Profile with Attendance Percentage
- ✅ Team Formation and Management
- ✅ Problem Statement Posting (with duplication check)
- ✅ Company Attendance Tracking
- ✅ Alumni Interaction and Messaging

### Alumni Features
- ✅ View Messages from Students
- ✅ Reply with Guidance

## Demo Data

For quick testing, you can:
1. Create an admin account
2. Add a few students manually
3. Mark attendance for a few dates
4. Upload a sample alumni Excel file
5. Login as a student to test student features

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally, or
- Update `MONGODB_URI` in backend `.env` to your MongoDB Atlas connection string

### CORS Issues
- Backend CORS is configured to allow all origins in development
- For production, update CORS settings in `backend/server.js`

### File Upload Issues
- Ensure the `backend/uploads` directory exists
- Check file permissions

### Authentication Issues
- Clear browser localStorage if experiencing login issues
- Check JWT_SECRET is set in backend `.env`

## API Testing

You can test the API using:
- Postman
- Thunder Client (VS Code extension)
- curl commands

Example API calls:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@byts.com","password":"admin123"}'

# Get Dashboard (with token)
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Notes

- The application uses JWT tokens stored in localStorage
- Alumni accounts are created automatically from Excel uploads
- Students can only be in one active team at a time
- Problem statements are checked for similarity using text search
- Attendance is marked department-wise and date-wise
