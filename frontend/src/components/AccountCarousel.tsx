import React, { useRef } from 'react';
import {
  FlatList,
  Animated,
  Dimensions,
  View,
  ListRenderItem,
} from 'react-native';
import styled from 'styled-components/native';
import { AccountCard } from './AccountCard';
import { Account } from '../types/account';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = 320;
const CARD_SPACING = 16;
const CARD_OFFSET = (screenWidth - CARD_WIDTH) / 2 - CARD_SPACING / 2;

const RootContainer = styled.View`
  margin-vertical: 20px;
`;

const CarouselContainer = styled.View`
  height: 240px;
`;

const PaginationContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
`;

const Dot = styled(Animated.View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #fff;
  margin: 0 5px;
`;

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList as new () => FlatList<Account>
);

interface AccountCarouselProps {
  accounts: Account[];
}

export const AccountCarousel: React.FC<AccountCarouselProps> = ({ accounts }) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  const renderCard: ListRenderItem<Account> = ({ item, index }) => {
    const itemWidth = CARD_WIDTH + CARD_SPACING;
    const inputRange = [
      (index - 1) * itemWidth,
      index * itemWidth,
      (index + 1) * itemWidth,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: 'clamp',
    });

    const animatedStyle = {
      transform: [{ scale }, { translateY }],
      opacity,
    };

    return (
      <View style={{ width: itemWidth }}>
        <AccountCard account={item} animatedStyle={animatedStyle} />
      </View>
    );
  };

  const getItemLayout = (_: any, index: number) => ({
    length: CARD_WIDTH + CARD_SPACING,
    offset: (CARD_WIDTH + CARD_SPACING) * index,
    index,
  });

  return (
    <RootContainer>
      <CarouselContainer>
        <Animated.FlatList
          data={accounts}
          renderItem={renderCard}
          keyExtractor={(item: Account) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: CARD_OFFSET,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          getItemLayout={getItemLayout}
          scrollEventThrottle={16}
        />
      </CarouselContainer>
      <PaginationContainer>
        {accounts.map((_, i) => {
          const itemWidth = CARD_WIDTH + CARD_SPACING;
          const inputRange = [
            (i - 1) * itemWidth,
            i * itemWidth,
            (i + 1) * itemWidth,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [1, 1.5, 1],
            extrapolate: 'clamp',
          });

          return <Dot key={`dot-${i}`} style={{ opacity, transform: [{ scale }] }} />;
        })}
      </PaginationContainer>
    </RootContainer>
  );
}; 