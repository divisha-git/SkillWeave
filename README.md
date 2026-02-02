# SkillWeave (BYTS KEC)

SkillWeave is a comprehensive platform designed to bridge the gap between students, alumni, and administration. It facilitates placement management, resource sharing, attendance tracking, and alumni networking.

## Features

### 🎓 Student Portal
- **Dashboard**: View profile stats and upcoming activities.
- **Attendance**: Track daily attendance and history.
- **Resources**: Access study materials, question banks, and placement resources.
- **Interview Experience**: Read and submit interview experiences/feedback for various companies.
- **Alumni Network**: Connect with alumni for mentorship (feature in progress).
- **Events**: View and register for upcoming college events and drives.

### 👨‍💼 Admin Portal
- **Dashboard**: Overview of total students, placements, and activities.
- **Student Management**: Manage student profiles and data.
- **Attendance Management**: Mark and view attendance records using visual tools.
- **Resource Center**: Upload and manage study materials.
- **Interview Experience**: Manage company-specific interview feedback tasks and review student submissions.
- **Event Management**: Create and manage events.
- **Alumni Management**: Oversee the alumni network.

### 👩‍🎓 Alumni Portal
- **Profile Management**: Update professional details.
- **Networking**: Connect with current students.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, React Router, Context API
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT, Google OAuth
- **Tools**: Concurrently (for running dev servers)

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (Local or Atlas)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/skillweave.git
    cd skillweave
    ```

2.  **Install Dependencies**
    The project includes a root script to install dependencies for both frontend and backend.
    ```bash
    npm run install:all
    ```
    *Alternatively, you can install them manually:*
    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    ```

### Environment Setup

You need to configure environment variables for both the backend and frontend.

**1. Backend (`backend/.env`)**
Create a file named `.env` in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/byts  # Or your Atlas URI
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id  # For Google Auth
EMAIL_SERVICE=gmail                       # Optional: For emails
EMAIL_USER=your_email@gmail.com           # Optional
EMAIL_PASS=your_app_password              # Optional
```

**2. Frontend (`frontend/.env`)**
Create a file named `.env` in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id  # Must match backend ID
```

### Running the Application

To run both the backend and frontend servers concurrently:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## Project Structure

```
skillweave/
├── backend/                 # Node.js/Express Server
│   ├── models/              # Mongoose Schemas (User, Attendance, etc.)
│   ├── routes/              # API Routes
│   ├── middleware/          # Auth middleware
│   └── server.js            # Entry point
├── frontend/                # React Vite App
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Page views (Admin, Student, Alumni)
│   │   └── utils/           # API helpers
├── package.json             # Root scripts
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
