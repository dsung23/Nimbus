import { StatusBar } from 'expo-status-bar';
import TestScreen from './src/screens/TestScreen';

export default function App() {
  return (
    <>
      <TestScreen />
      <StatusBar style="auto" />
    </>
  );
}
