import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  Dashboard: 'grid',
  Chatbot: 'sparkles',
  Profile: 'person',
  
};

export const GlassmorphicTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <BlurView intensity={80} tint="dark" style={styles.blurView}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel?.toString() ?? options.title ?? route.name;
            const isFocused = state.index === index;
            const iconName = ICONS[route.name] || 'ellipse-outline';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            const color = isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                <Ionicons name={iconName} size={24} color={color} />
                <Text style={[styles.label, { color }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    height: 90,
    backgroundColor: 'rgba(50, 50, 50, 0.4)',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 4,
  },
}); 