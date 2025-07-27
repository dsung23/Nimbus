import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  Dashboard: 'grid',
  Budgeting: 'wallet',
  Chatbot: 'sparkles',
  Profile: 'person',
};

export const GlassmorphicTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <BlurView intensity={180} tint="dark" style={styles.blurView}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.tabBar}>
          <View style={styles.glassOverlay} pointerEvents="none" />
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
                <Ionicons name={iconName} size={20} color={color} />
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
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'rgba(30, 30, 30, 0.18)',
    alignItems: 'center',
    justifyContent: 'space-around',
    overflow: 'hidden',
    position: 'relative',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 9,
    marginTop: 2,
  },
}); 