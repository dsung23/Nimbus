import React from 'react';
import { Modal, TouchableOpacity, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { Account } from '../types/account';

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.9);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.View`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  max-height: 400px;
  backdrop-filter: blur(10px);
`;

const ModalHeader = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
`;

const AccountList = styled(ScrollView)`
  max-height: 300px;
`;

const AccountItem = styled(TouchableOpacity)<{ selected: boolean }>`
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
  background-color: ${props => props.selected ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
`;

const AccountItemName = styled.Text<{ selected: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.selected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'};
  margin-bottom: 4px;
`;

const AccountItemDetails = styled.Text<{ selected: boolean }>`
  font-size: 14px;
  color: ${props => props.selected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)'};
`;

const CloseButton = styled(TouchableOpacity)`
  padding: 16px 20px;
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.1);
  align-items: center;
`;

const CloseButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
`;

interface AccountSelectorProps {
  visible: boolean;
  accounts: Account[];
  selectedAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  onClose: () => void;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  visible,
  accounts,
  selectedAccount,
  onSelectAccount,
  onClose
}) => {
  const handleAccountPress = (account: Account) => {
    onSelectAccount(account);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Select Account</ModalTitle>
          </ModalHeader>
          
          <AccountList showsVerticalScrollIndicator={false}>
            {accounts.map((account) => (
              <AccountItem
                key={account.id}
                selected={selectedAccount?.id === account.id}
                onPress={() => handleAccountPress(account)}
              >
                <AccountItemName selected={selectedAccount?.id === account.id}>
                  {account.name}
                </AccountItemName>
                <AccountItemDetails selected={selectedAccount?.id === account.id}>
                  {account.type} • {account.mask}
                </AccountItemDetails>
              </AccountItem>
            ))}
          </AccountList>
          
          <CloseButton onPress={onClose}>
            <CloseButtonText>Cancel</CloseButtonText>
          </CloseButton>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}; 