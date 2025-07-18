import React from 'react';
import { View, Text, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { PhoneNumberInput } from './PhoneNumberInput';

interface PhoneEditModalProps {
  isVisible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const PhoneEditModal: React.FC<PhoneEditModalProps> = ({
  isVisible,
  value,
  onChangeText,
  onSave,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <Modal visible={true} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ 
              width: '90%', 
              backgroundColor: 'rgba(40, 40, 40, 0.8)', 
              borderRadius: 24, 
              padding: 24,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>
                Edit Phone Number
              </Text>
              <PhoneNumberInput
                label=""
                value={value}
                onChangeText={onChangeText}
                placeholder="Enter phone number"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 }}>
                <TouchableOpacity 
                  onPress={onClose}
                  style={{ padding: 12, marginRight: 16 }}
                >
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, fontWeight: '600' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={onSave}
                  style={{ padding: 12 }}
                >
                  <Text style={{ color: '#4facfe', fontSize: 16, fontWeight: '600' }}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
}; 