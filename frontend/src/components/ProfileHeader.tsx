import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '../types/user';

interface ProfileHeaderProps {
  user: User;
}

const getInitials = (first: string, last: string) => {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => (
  <View style={styles.container}>
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{getInitials(user.first_name, user.last_name)}</Text>
    </View>
    <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
    <Text style={styles.memberSince}>Member since {user.created_at ? new Date(user.created_at).getFullYear() : ''}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  memberSince: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
}); 