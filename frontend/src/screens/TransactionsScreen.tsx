import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator, Text, TouchableOpacity, TextInput } from 'react-native';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Background } from '../components/Background';
import { TransactionItem } from '../components/TransactionItem';
import { AccountSelector } from '../components/AccountSelector';
import { getTransactions } from '../api/tellerService';
import { getAccounts } from '../api/accountService';
import { Transaction } from '../types/transaction';
import { Account } from '../types/account';

const Container = styled.View`
  flex: 1;
  padding: 20px;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 30px;
`;

const BackButton = styled(TouchableOpacity)`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-right: 16px;
`;

const BackButtonText = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
`;

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
`;

const AccountSelectorSection = styled.View`
  margin-bottom: 20px;
`;

const AccountSelectorTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
`;

const AccountSelectorButton = styled(TouchableOpacity)`
  padding: 16px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const AccountInfo = styled.View`
  flex: 1;
`;

const AccountName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const AccountDetails = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const SelectorArrow = styled.Text`
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
`;

const FilterSection = styled.View`
  margin-bottom: 20px;
`;

const FilterTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
`;

const SearchInput = styled(TextInput)`
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 16px;
`;

const SearchInputPlaceholder = styled.Text`
  color: rgba(255, 255, 255, 0.5);
`;

const FilterRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

const FilterButton = styled(TouchableOpacity)<{ active: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.active ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
`;

const FilterButtonText = styled.Text<{ active: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
`;

const ContentContainer = styled.View`
  flex: 1;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ErrorText = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 16px;
`;

const RetryButton = styled(TouchableOpacity)`
  padding: 12px 24px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const RetryButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const EmptyText = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`;

const TransactionCount = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
`;

const LoadMoreButton = styled(TouchableOpacity)`
  padding: 16px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  align-items: center;
  margin-top: 16px;
`;

const LoadMoreButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const PaginationInfo = styled.Text`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-top: 8px;
`;

type RootStackParamList = {
  Dashboard: undefined;
  Transactions: undefined;
};

type TransactionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Transactions'>;

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  
  // Account selection state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  
  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const ITEMS_PER_PAGE = 20;

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      setAccountsError(null);
      
      const response = await getAccounts();
      setAccounts(response.accounts);
      
      // Auto-select first account if available
      if (response.accounts.length > 0) {
        setSelectedAccount(response.accounts[0]);
      }
    } catch (err) {
      setAccountsError('Failed to load accounts. Please try again.');
      console.error('Error fetching accounts:', err);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!selectedAccount) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getTransactions(selectedAccount.id);
      setTransactions(response.transactions);
    } catch (err) {
      setError('Failed to load transactions. Please try again.');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(transaction => {
        const description = transaction.description.toLowerCase();
        const merchant = (transaction.user_merchant || transaction.teller_merchant || '').toLowerCase();
        const category = (transaction.user_category || transaction.teller_category || '').toLowerCase();
        
        return description.includes(query) || 
               merchant.includes(query) || 
               category.includes(query);
      });
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const updateDisplayedTransactions = () => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    setDisplayedTransactions(filteredTransactions.slice(startIndex, endIndex));
  };

  const handleLoadMore = () => {
    if (displayedTransactions.length < filteredTransactions.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setLoadingMore(false);
      }, 500); // Small delay for better UX
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions();
    }
  }, [selectedAccount]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, activeFilter, searchQuery]);

  useEffect(() => {
    updateDisplayedTransactions();
  }, [filteredTransactions, currentPage]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    if (accountsError) {
      fetchAccounts();
    } else {
      fetchTransactions();
    }
  };

  const handleFilterPress = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleAccountSelect = () => {
    setShowAccountSelector(true);
  };

  const handleAccountSelection = (account: Account) => {
    setSelectedAccount(account);
    setShowAccountSelector(false);
  };

  const handleCloseAccountSelector = () => {
    setShowAccountSelector(false);
  };

  const hasMoreTransactions = displayedTransactions.length < filteredTransactions.length;
  const showingCount = displayedTransactions.length;
  const totalCount = filteredTransactions.length;

  // Show loading for accounts
  if (accountsLoading) {
    return (
      <Background>
        <Container>
          <Header>
            <BackButton onPress={handleBackPress}>
              <BackButtonText>←</BackButtonText>
            </BackButton>
            <HeaderTitle>Transactions</HeaderTitle>
          </Header>
          <LoadingContainer>
            <ActivityIndicator size="large" color="#ffffff" />
          </LoadingContainer>
        </Container>
      </Background>
    );
  }

  // Show error for accounts
  if (accountsError) {
    return (
      <Background>
        <Container>
          <Header>
            <BackButton onPress={handleBackPress}>
              <BackButtonText>←</BackButtonText>
            </BackButton>
            <HeaderTitle>Transactions</HeaderTitle>
          </Header>
          <ErrorContainer>
            <ErrorText>{accountsError}</ErrorText>
            <RetryButton onPress={handleRetry}>
              <RetryButtonText>Retry</RetryButtonText>
            </RetryButton>
          </ErrorContainer>
        </Container>
      </Background>
    );
  }

  // Show no accounts message
  if (accounts.length === 0) {
    return (
      <Background>
        <Container>
          <Header>
            <BackButton onPress={handleBackPress}>
              <BackButtonText>←</BackButtonText>
            </BackButton>
            <HeaderTitle>Transactions</HeaderTitle>
          </Header>
          <EmptyContainer>
            <EmptyText>No bank accounts found. Please connect an account first.</EmptyText>
          </EmptyContainer>
        </Container>
      </Background>
    );
  }

  return (
    <Background>
      <Container>
        <Header>
          <BackButton onPress={handleBackPress}>
            <BackButtonText>←</BackButtonText>
          </BackButton>
          <HeaderTitle>Transactions</HeaderTitle>
        </Header>
        
        <AccountSelectorSection>
          <AccountSelectorTitle>Select Account</AccountSelectorTitle>
          <AccountSelectorButton onPress={handleAccountSelect}>
            <AccountInfo>
              <AccountName>{selectedAccount?.name || 'Select an account'}</AccountName>
              <AccountDetails>
                {selectedAccount ? `${selectedAccount.type} • ${selectedAccount.mask}` : 'No account selected'}
              </AccountDetails>
            </AccountInfo>
            <SelectorArrow>▼</SelectorArrow>
          </AccountSelectorButton>
        </AccountSelectorSection>
        
        <FilterSection>
          <SearchInput
            placeholder="Search transactions..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          
          <FilterTitle>Filter by Type</FilterTitle>
          <FilterRow>
            <FilterButton 
              active={activeFilter === 'all'} 
              onPress={() => handleFilterPress('all')}
            >
              <FilterButtonText active={activeFilter === 'all'}>All</FilterButtonText>
            </FilterButton>
            <FilterButton 
              active={activeFilter === 'income'} 
              onPress={() => handleFilterPress('income')}
            >
              <FilterButtonText active={activeFilter === 'income'}>Income</FilterButtonText>
            </FilterButton>
            <FilterButton 
              active={activeFilter === 'expense'} 
              onPress={() => handleFilterPress('expense')}
            >
              <FilterButtonText active={activeFilter === 'expense'}>Expenses</FilterButtonText>
            </FilterButton>
            <FilterButton 
              active={activeFilter === 'transfer'} 
              onPress={() => handleFilterPress('transfer')}
            >
              <FilterButtonText active={activeFilter === 'transfer'}>Transfers</FilterButtonText>
            </FilterButton>
          </FilterRow>
        </FilterSection>

        <ContentContainer>
          {loading ? (
            <LoadingContainer>
              <ActivityIndicator size="large" color="#ffffff" />
            </LoadingContainer>
          ) : error ? (
            <ErrorContainer>
              <ErrorText>{error}</ErrorText>
              <RetryButton onPress={handleRetry}>
                <RetryButtonText>Retry</RetryButtonText>
              </RetryButton>
            </ErrorContainer>
          ) : filteredTransactions.length === 0 ? (
            <EmptyContainer>
              <EmptyText>
                {searchQuery.trim() 
                  ? `No transactions found for "${searchQuery}"`
                  : activeFilter === 'all' 
                    ? 'No transactions found' 
                    : `No ${activeFilter} transactions found`
                }
              </EmptyText>
            </EmptyContainer>
          ) : (
            <>
              <TransactionCount>
                Showing {showingCount} of {totalCount} transactions
              </TransactionCount>
              <ScrollView showsVerticalScrollIndicator={false}>
                {displayedTransactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
                
                {hasMoreTransactions && (
                  <LoadMoreButton onPress={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <LoadMoreButtonText>Load More Transactions</LoadMoreButtonText>
                    )}
                  </LoadMoreButton>
                )}
                
                {!hasMoreTransactions && totalCount > 0 && (
                  <PaginationInfo>All transactions loaded</PaginationInfo>
                )}
              </ScrollView>
            </>
          )}
        </ContentContainer>

        <AccountSelector
          visible={showAccountSelector}
          accounts={accounts}
          selectedAccount={selectedAccount}
          onSelectAccount={handleAccountSelection}
          onClose={handleCloseAccountSelector}
        />
      </Container>
    </Background>
  );
}; 