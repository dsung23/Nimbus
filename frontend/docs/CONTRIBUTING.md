# Contributing to CoFund Frontend

## Table of Contents
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Testing](#testing)
- [Debugging](#debugging)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Getting Started

Welcome to the CoFund frontend development team! This guide will help you set up your development environment and start contributing to the project.

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd cofund/frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (v2.30.0 or higher)

### Development Tools

- **Expo CLI** (v6.0.0 or higher)
- **React Native Debugger** (optional but recommended)
- **VS Code** with recommended extensions (see below)

### Mobile Development

- **iOS Simulator** (macOS only)
- **Android Studio** with Android SDK
- **Physical device** for testing

### VS Code Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-react-native"
  ]
}
```

## Environment Setup

### 1. Install Node.js and npm

Download and install Node.js from [nodejs.org](https://nodejs.org/). This will also install npm.

Verify installation:
```bash
node --version
npm --version
```

### 2. Install Expo CLI

```bash
npm install -g @expo/cli
```

Verify installation:
```bash
expo --version
```

### 3. Install React Native CLI (Optional)

```bash
npm install -g react-native-cli
```

### 4. Set up Mobile Development Environment

#### For iOS (macOS only):

1. Install Xcode from the App Store
2. Install iOS Simulator
3. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```

#### For Android:

1. Install Android Studio
2. Install Android SDK
3. Set up environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### 5. Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd cofund/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 6. Configure Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
API_BASE_URL=http://192.168.1.7:3789
API_TIMEOUT=10000

# Development
NODE_ENV=development
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Optional: Analytics
ANALYTICS_ENABLED=false
```

## Development Workflow

### Starting the Development Server

```bash
# Start Expo development server
npm start

# Or use specific platforms
npm run android
npm run ios
npm run web
```

### Available Scripts

```bash
# Development
npm start          # Start Expo development server
npm run android    # Start Android development
npm run ios        # Start iOS development
npm run web        # Start web development

# Building
npm run build      # Build for production
npm run eject      # Eject from Expo (irreversible)

# Testing
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Linting and Formatting
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run format     # Format code with Prettier
```

### Development Commands

```bash
# Install new dependencies
npm install <package-name>

# Add development dependencies
npm install --save-dev <package-name>

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Code Style Guide

### TypeScript Guidelines

- Use TypeScript for all new code
- Define proper interfaces for all props and state
- Use strict type checking
- Avoid `any` type - use proper typing

```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Bad
const user: any = { id: 1, name: 'John' };
```

### React Component Guidelines

- Use functional components with hooks
- Use TypeScript interfaces for props
- Keep components small and focused
- Use proper naming conventions

```typescript
// Good
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled = false }) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

// Bad
const Button = (props) => {
  return <TouchableOpacity onPress={props.onPress}>{props.title}</TouchableOpacity>;
};
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useUserProfile.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `user.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### Folder Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Basic UI components
│   └── features/       # Feature-specific components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── assets/             # Static assets
```

### Styling Guidelines

- Use Styled Components for styling
- Follow the glassmorphic design system
- Use consistent spacing and typography
- Implement responsive design

```typescript
// Good
const StyledContainer = styled.View`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin: 16px;
`;

// Bad
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
  },
});
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=LoginScreen

# Run tests for specific platform
npm test -- --platform=ios
```

### Writing Tests

- Write tests for all components and hooks
- Use React Native Testing Library
- Test user interactions and edge cases
- Maintain good test coverage

```typescript
// Example test
import { render, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';

describe('LoginScreen', () => {
  it('should handle login form submission', () => {
    const mockOnLogin = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLogin={mockOnLogin} />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    expect(mockOnLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

## Debugging

### React Native Debugger

1. Install React Native Debugger
2. Start the debugger before running the app
3. Enable debugging in the app
4. Use Chrome DevTools for debugging

### Expo DevTools

- Access Expo DevTools at `http://localhost:19002`
- Use for device management and logs
- Monitor performance and errors

### Console Logging

```typescript
// Use proper logging levels
console.log('Info message');
console.warn('Warning message');
console.error('Error message');

// Use __DEV__ for development-only logs
if (__DEV__) {
  console.log('Development only log');
}
```

### Performance Monitoring

- Use React DevTools Profiler
- Monitor bundle size
- Check for memory leaks
- Use performance monitoring tools

## Deployment

### Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for web
expo build:web
```

### App Store Deployment

1. Configure app.json for production
2. Build the app bundle
3. Submit to App Store Connect
4. Configure TestFlight for beta testing

### Play Store Deployment

1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Configure internal testing
4. Release to production

## Troubleshooting

### Common Issues

#### Metro Bundler Issues

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -rf node_modules
npm install
```

#### iOS Build Issues

```bash
# Clean Xcode build
cd ios && xcodebuild clean

# Reset iOS Simulator
xcrun simctl erase all

# Update CocoaPods
cd ios && pod install
```

#### Android Build Issues

```bash
# Clean Android build
cd android && ./gradlew clean

# Reset Android emulator
adb emu kill
```

#### Expo Issues

```bash
# Clear Expo cache
expo r -c

# Reset Expo CLI
expo logout
expo login

# Update Expo CLI
npm install -g @expo/cli@latest
```

### Getting Help

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Search existing issues in the repository
3. Ask questions in the team chat
4. Create a new issue with detailed information

### Performance Issues

- Use React DevTools Profiler
- Check for unnecessary re-renders
- Optimize images and assets
- Monitor bundle size
- Use performance monitoring tools

## Code Review Process

1. Create a feature branch from `main`
2. Make your changes following the style guide
3. Write tests for new functionality
4. Update documentation if needed
5. Submit a pull request
6. Address review feedback
7. Merge after approval

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Performance is acceptable
- [ ] Accessibility is considered
- [ ] Cross-platform compatibility tested

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Styled Components Documentation](https://styled-components.com/)
- [React Navigation Documentation](https://reactnavigation.org/)

## Support

For questions or issues:

1. Check the troubleshooting section above
2. Search existing documentation
3. Ask in the team chat
4. Create an issue with detailed information

Welcome to the team! 🚀 