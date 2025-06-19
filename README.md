# CoFund - Bare-Bone React Native + Express Setup

A minimal, organized React Native frontend with Express backend setup.

## Project Structure

```
cofund/
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Data models
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── frontend/              # React Native Expo app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   └── services/      # API services
│   ├── App.tsx           # Main app component
│   └── package.json      # Frontend dependencies
└── README.md             # This file
```

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```
Server runs on `http://localhost:4000`

### Frontend
```bash
cd frontend
npm install
npm start
```

Open with:
- **iOS**: Press `i`
- **Android**: Press `a`
- **Web**: Press `w`

## Test Connection

1. Start both backend and frontend
2. In the app, tap "Test Backend" button
3. Should see success message: "Hello from backend! 🚀"

## For Physical Device

Replace `localhost` with your IP address in `frontend/src/services/api.ts`:
```javascript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:4000';
```

Find your IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows  
ipconfig | findstr "IPv4"
```

That's it! Clean, organized, and ready for development. 🚀
