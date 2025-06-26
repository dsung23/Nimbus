import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface BackgroundProps {
  children: React.ReactNode;
}

export const Background: React.FC<BackgroundProps> = ({ children }) => {
  return (
    <LinearGradient
      colors={['#000000', '#000000']}
      style={styles.gradient}
    >
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      {/* Overlay gradient for glassmorphism effect */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0)']}
        style={styles.overlay}
        pointerEvents="none"
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
}); 