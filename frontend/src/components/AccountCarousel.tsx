import React, { useRef, useState } from 'react';
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
const CARD_OFFSET = (screenWidth - CARD_WIDTH) / 2;

const CarouselContainer = styled.View`
  height: 240px;
  margin-vertical: 20px;
`;

// Create animated FlatList for native driver support
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Account>);

const CarouselFlatList = styled(AnimatedFlatList)`
  flex: 1;
`;

interface AccountCarouselProps {
  accounts: Account[];
}

export const AccountCarousel: React.FC<AccountCarouselProps> = ({ accounts }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const renderCard: ListRenderItem<Account> = ({ item, index }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    // Scale animation
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    // TranslateY animation for stacked effect
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: 'clamp',
    });

    // Opacity animation
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    const animatedStyle = {
      transform: [
        { scale },
        { translateY },
      ],
      opacity,
    };

    return (
      <View style={{ width: CARD_WIDTH + CARD_SPACING }}>
        <AccountCard account={item} animatedStyle={animatedStyle} />
      </View>
    );
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING));
        setActiveIndex(index);
      },
    }
  );

  const getItemLayout = (_: any, index: number) => ({
    length: CARD_WIDTH + CARD_SPACING,
    offset: (CARD_WIDTH + CARD_SPACING) * index,
    index,
  });

  return (
    <CarouselContainer>
      <CarouselFlatList
        data={accounts}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: CARD_OFFSET,
        }}
        onScroll={handleScroll}
        getItemLayout={getItemLayout}
        pagingEnabled={false}
        scrollEventThrottle={16}
      />
    </CarouselContainer>
  );
}; 