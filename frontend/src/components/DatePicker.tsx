import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import styled from 'styled-components/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const InputContainer = styled.View`
  margin-bottom: 20px;
`;

const Label = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-weight: 500;
`;

const InputWrapper = styled.View`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const TouchableInput = styled.TouchableOpacity`
  padding: 18px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const InputText = styled.Text<{ hasValue: boolean }>`
  color: ${props => props.hasValue ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'};
  font-size: 16px;
  font-weight: 500;
  flex: 1;
  margin-left: 32px;
`;

const IconContainer = styled.View`
  position: absolute;
  left: 18px;
  top: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  width: 20px;
`;

const ChevronIcon = styled.View`
  margin-left: 8px;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.View`
  background-color: #1a1a1a;
  border-radius: 20px;
  padding: 24px;
  margin: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  margin-bottom: 20px;
`;

const ModalButtons = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
`;

const ModalButton = styled.TouchableOpacity<{ variant: 'cancel' | 'confirm' }>`
  padding: 12px 24px;
  border-radius: 12px;
  background-color: ${props => props.variant === 'confirm' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.variant === 'confirm' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
`;

const ModalButtonText = styled.Text<{ variant: 'cancel' | 'confirm' }>`
  color: ${props => props.variant === 'confirm' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 16px;
  font-weight: 500;
`;

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon = 'calendar',
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ? new Date(value) : new Date());

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        const formattedDate = formatDate(selectedDate);
        onChangeText(formattedDate);
      }
    } else {
      // iOS: Update temp date for preview
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    const formattedDate = formatDate(tempDate);
    onChangeText(formattedDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value ? new Date(value) : new Date());
    setShowPicker(false);
  };

  const openPicker = () => {
    setShowPicker(true);
  };

  return (
    <InputContainer>
      <Label>{label}</Label>
      <InputWrapper>
        <BlurView intensity={40} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <IconContainer>
          <Ionicons name={icon} size={20} color="rgba(255, 255, 255, 0.7)" />
        </IconContainer>
        <TouchableInput onPress={openPicker}>
          <InputText hasValue={!!value}>
            {value || placeholder}
          </InputText>
          <ChevronIcon>
            <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.7)" />
          </ChevronIcon>
        </TouchableInput>
      </InputWrapper>

      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal
            transparent
            visible={showPicker}
            animationType="fade"
            onRequestClose={handleCancel}
          >
            <ModalOverlay>
              <ModalContent>
                <ModalTitle>Select Date of Birth</ModalTitle>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  textColor="#ffffff"
                  style={{ backgroundColor: 'transparent' }}
                />
                <ModalButtons>
                  <ModalButton variant="cancel" onPress={handleCancel}>
                    <ModalButtonText variant="cancel">Cancel</ModalButtonText>
                  </ModalButton>
                  <ModalButton variant="confirm" onPress={handleConfirm}>
                    <ModalButtonText variant="confirm">Confirm</ModalButtonText>
                  </ModalButton>
                </ModalButtons>
              </ModalContent>
            </ModalOverlay>
          </Modal>
        ) : (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )
      )}
    </InputContainer>
  );
}; 