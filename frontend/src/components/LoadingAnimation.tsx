import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

export const LoadingAnimation: React.FC = () => {
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [dotOpacity]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: '#ffffff', fontSize: 16, lineHeight: 22 }}>Nimbus is thinking</Text>
      <Animated.Text
        style={{
          color: '#ffffff',
          fontSize: 16,
          lineHeight: 22,
          opacity: dotOpacity,
          marginLeft: 4
        }}
      >
        ...
      </Animated.Text>
    </View>
  );
}; 