import React from 'react';
import styled from 'styled-components/native';
import { Transaction } from '../types/transaction';

const Container = styled.View`
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const LeftSection = styled.View`
  flex: 1;
  margin-right: 16px;
`;

const Description = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const Category = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
`;

const DateText = styled.Text`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const Amount = styled.Text<{ isExpense: boolean }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.isExpense ? '#ff6b6b' : '#51cf66'};
`;

const StatusIndicator = styled.View<{ status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${props => {
    switch (props.status) {
      case 'posted': return '#51cf66';
      case 'pending': return '#ffd43b';
      case 'cancelled': return '#ff6b6b';
      case 'disputed': return '#ff922b';
      default: return '#868e96';
    }
  }};
  margin-left: 8px;
`;

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isExpense = transaction.type === 'expense';
  const amountPrefix = isExpense ? '-' : '+';
  const displayAmount = `${amountPrefix}$${Math.abs(transaction.amount).toFixed(2)}`;
  
  const displayCategory = transaction.user_category || transaction.teller_category || 'Uncategorized';
  const displayMerchant = transaction.user_merchant || transaction.teller_merchant || transaction.description;

  return (
    <Container>
      <Row>
        <LeftSection>
          <Description>{displayMerchant}</Description>
          <Category>{displayCategory}</Category>
          <DateText>{new Date(transaction.date).toLocaleDateString()}</DateText>
        </LeftSection>
        <Row>
          <Amount isExpense={isExpense}>{displayAmount}</Amount>
          <StatusIndicator status={transaction.status} />
        </Row>
      </Row>
    </Container>
  );
}; 