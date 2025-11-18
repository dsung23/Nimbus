# Nimbus 💰

> A full-stack personal finance application with AI-powered budgeting and secure bank integration

## Overview

Nimbus is a comprehensive personal finance management platform that combines intelligent AI-driven insights with secure bank account integration. The application helps users track spending, manage budgets, and receive personalized financial recommendations through an advanced chatbot interface.

## Demo Link
[Youtube Demo Link](https://youtube.com/shorts/pKXGi9nTFPA)

## Technology Stack

### Frontend
- **React Native** - Cross-platform mobile application
- **TypeScript** - Type-safe development
- **Expo** - Mobile development framework

### Backend
- **Node.js** - Server runtime
- **Express** - RESTful API framework
- **PostgreSQL** - Relational database
- **SQL** - Database queries and migrations

### Integrations & Services
- **Teller API** - Bank account connectivity and transaction data
- **Groq API** - Large Language Model for AI-powered financial insights
- **Supabase** - Database and authentication services

## Core Features

### AI-Powered Budgeting Assistant
- Intelligent chatbot that analyzes transaction patterns across 66 categories
- Personalized budgeting recommendations based on spending behavior
- Conversational interface for budgetting guidance

### Secure Bank Integration
- Multi-institution account connectivity via Teller API
- Encrypted data storage and transmission
- Real-time account and transaction synchronization
- Support for multiple bank accounts per user

### Financial Management
- Transaction tracking and categorization
- Account balance monitoring
- Budget planning and analysis
- User-friendly dashboard and reporting

### Security & Authentication
- Secure user authentication system
- Encrypted sensitive financial data
- Protected API endpoints with middleware validation

## Architecture

```
Nimbus/
├── frontend/          # React Native mobile app
│   ├── screens/       # User interface screens
│   ├── components/    # Reusable UI components
│   ├── services/      # API integration layer
│   └── contexts/      # State management
│
└── backend/           # Node.js Express server
    ├── routes/        # API endpoints
    ├── controllers/   # Business logic
    ├── services/      # External API integrations (Teller, Groq)
    ├── models/        # Data models
    └── middleware/    # Authentication & validation
```

## Technical Highlights

- **Full-stack development** from mobile UI to database design
- **RESTful API architecture** with proper separation of concerns
- **Database migrations** and schema management
- **Third-party API integration** with error handling and data transformation
- **AI/LLM integration** for intelligent financial analysis
- **Security best practices** including encryption and authentication middleware
- **TypeScript** for type safety across the frontend
- **Cross-platform mobile** deployment via React Native

## Project Impact

- Successfully onboarded and served **20 beta users** during initial launch
- Processed and categorized transactions across **66 distinct categories**
- Demonstrated production-ready application with real-world usage

## Development Setup

### Prerequisites
- Node.js (v14+)
- PostgreSQL database
- Expo CLI (for mobile development)
- Teller API credentials
- Groq API key

### Quick Start

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
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

---

