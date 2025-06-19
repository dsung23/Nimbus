import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TestScreen() {
  const [data, setData] = useState<any>(null);

  const hitBackend = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/test');
      const result = await response.json();
      setData(result);
    } catch (error) {
      setData({ error: 'Failed to connect' });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={hitBackend}>
        <Text style={styles.buttonText}>Hit Backend</Text>
      </TouchableOpacity>
      {data && (
        <Text style={styles.result}>{JSON.stringify(data, null, 2)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 20 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  result: { fontSize: 12, textAlign: 'center' },
});
