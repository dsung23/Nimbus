# PhoneNumberInput Component

## Overview
A custom phone number input component that integrates with `react-native-country-picker-modal` to provide country code selection and phone number formatting. Built with glassmorphic styling to match the app's design theme.

## Features
- **Country picker integration**: Tap the country code button to select from 200+ countries
- **Phone number formatting**: Automatically formats and validates phone numbers
- **Glassmorphic styling**: Consistent with the app's design theme using BlurView
- **Cross-platform**: Works on both iOS and Android
- **TypeScript support**: Fully typed with proper interfaces

## Dependencies
- `react-native-country-picker-modal`: For country selection
- `expo-blur`: For glassmorphic background effect
- `styled-components`: For styling
- `@expo/vector-icons`: For icons

## Props
- `label`: Display label for the input field
- `value`: Current phone number value
- `onChangeText`: Callback function when phone number changes
- `placeholder`: Placeholder text (defaults to "Enter phone number")
- `error`: Error message to display below the input

## Usage
```tsx
<PhoneNumberInput
  label="Phone Number"
  value={phoneNumber}
  onChangeText={setPhoneNumber}
  placeholder="Enter your phone number"
  error={phoneError}
/>
```

## Implementation Details
- Uses a custom TextInput with phone-pad keyboard type
- Country picker opens in a modal with search functionality
- Automatically cleans phone number input (removes non-digit characters except +)
- Displays country code with globe icon and chevron
- Integrates with existing form validation patterns
- Maintains state for selected country and calling code

## Styling
- Glassmorphic background with BlurView
- Consistent border radius and padding with other form inputs
- White text with proper opacity for placeholders
- Error text in red color scheme
- Country picker button with subtle background highlight 