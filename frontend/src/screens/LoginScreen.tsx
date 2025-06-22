import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const LoginScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Login Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
  },
  text: {
    color: '#fff',
    fontSize: 24,
  },
}); 