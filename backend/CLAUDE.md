# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Server Operations
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon hot reload
- `node index.js` - Direct server start

### Testing
- `npm test` - Run all tests with Jest (sequential execution)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Database Management
- `npm run db:test` - Test Supabase database connection
- `npm run db:init` - Display schema information (reference only)
- `npm run db:setup` - Generate complete database setup SQL file
- `npm run db:generate-sql` - Print complete schema SQL to console

### Migration System
- `npm run migrate` - Run pending migrations (requires manual SQL execution in Supabase)
- `npm run migrate:create` - Create new migration file
- `npm run migrate:status` - Show migration status

## Architecture Overview

### Application Structure
- **Entry Point**: `index.js` - Simple Express server setup with CORS and API routing
- **Main App Logic**: `src/app.js` - Express app configuration with webhook and API routes
- **Database**: Supabase with custom schema management and validation system

### Core Components

#### Database Layer (`src/utils/database.js`)
- Supabase client initialization with environment validation
- Custom schema validation system using Joi-like validation rules
- SQL generation utilities for table creation, indexes, and RLS policies
- Schema definitions located in `src/schemas/` directory

#### Authentication System
- Uses Supabase Auth for user management
- Custom middleware for session validation (`src/middleware/auth.js`)
- Input validation with Joi schemas (`src/middleware/validation.js`)
- Controller-based architecture (`src/controllers/userController.js`)

#### API Structure
- Modular route organization in `src/routes/`
- Main API aggregator at `src/routes/api.js` 
- Separated webhook routes (`src/routes/webhooks.js`)
- Health check and version endpoints available

#### Key Schemas
- User profiles and authentication
- Bank accounts (Plaid integration)
- Transaction history
- Chat sessions and messages for LLM chatbot functionality

### Database Approach
The system uses a dual approach for database management:
1. **Schema Definitions**: JavaScript-based schema objects with validation rules, SQL creation statements, indexes, and RLS policies
2. **Migration System**: File-based migrations that must be manually executed in Supabase SQL Editor

### Environment Configuration
Required environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `PORT` - Server port (defaults to 4000)

### Testing Setup
- Jest configuration with node environment
- Setup file at `tests/setup.js`
- Test timeout set to 10 seconds
- Tests run sequentially with `--runInBand` flag

## Key Development Notes

### Database Operations
- All database tables use UUID primary keys via `uuid_generate_v4()`
- Row Level Security (RLS) is enabled on all tables
- Schema validation is performed in JavaScript before database operations
- Database setup requires manual SQL execution in Supabase dashboard

### Authentication Flow
- Registration/login via Supabase Auth
- Session-based authentication with JWT tokens
- Custom validation middleware for all auth routes
- Profile data synced between auth system and user table

### Current Status
- User authentication system is fully implemented
- Database schema system is established
- Core API structure is in place
- Webhook system is configured
- Testing framework is set up

The codebase is well-structured for a Node.js/Express backend with Supabase integration, focusing on personal finance functionality with bank account integration capabilities.