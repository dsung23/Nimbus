# DatePicker Component

## Overview
A cross-platform date picker component that integrates seamlessly with the app's glassmorphic theme. Built using `@react-native-community/datetimepicker` for native date selection on both iOS and Android.

## Features
- **Cross-platform compatibility**: Works on both iOS and Android with platform-specific UI
- **Glassmorphic styling**: Consistent with the app's design theme
- **Date validation**: Automatically formats dates as YYYY-MM-DD
- **Age restrictions**: Prevents selection of future dates and dates before 1900
- **Touch-friendly**: Tap to open date picker with visual feedback

## Props
- `label`: Display label for the input field
- `value`: Current date value (string in YYYY-MM-DD format)
- `onChangeText`: Callback function when date changes
- `placeholder`: Placeholder text when no date is selected
- `icon`: Ionicons icon name (defaults to 'calendar')

## Usage
```tsx
<DatePicker
  label="Date of Birth"
  value={dateOfBirth}
  onChangeText={setDateOfBirth}
  placeholder="Select your date of birth"
  icon="calendar"
/>
```

## Platform Differences
- **iOS**: Uses a modal with spinner picker and Confirm/Cancel buttons
- **Android**: Uses native date picker dialog that closes on selection

## Implementation Details
- Uses `BlurView` for glassmorphic background effect
- Handles date formatting automatically
- Maintains temporary state for iOS modal preview
- Provides visual feedback with chevron icon
- Integrates with existing form validation patterns 