import React, { useRef, useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, Animated, Keyboard, TouchableWithoutFeedback, View, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { Background } from '../components/Background';
import { MessageComponent } from '../components/MessageComponent';
import { useChat } from '../hooks/useChat';
import { Ionicons } from '@expo/vector-icons';
import { ChatErrorBoundary } from '../components/ChatErrorBoundary';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const Container = styled.View`
  flex: 1;
`;

const Header = styled.View`
  padding: 16px;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
`;

const HeaderTitle = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin-left: 0;
`;

const MessagesContainer = styled(ScrollView)`
  padding: 0 16px;
`;

const InputContainer = styled.View<{ isKeyboardVisible: boolean }>`
  padding: 12px 16px;
  padding-bottom: ${props => props.isKeyboardVisible ? '80px' : '120px'};
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: rgba(5, 5, 5, 0.95);
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.1);
`;

const InputWrapper = styled.View`
  flex: 1;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 10px 14px;
  backdrop-filter: blur(10px);
  min-height: 44px;
  justify-content: center;
`;

const StyledTextInput = styled(TextInput)`
  color: #ffffff;
  font-size: 16px;
  max-height: 80px;
  min-height: 20px;
  padding: 0;
  keyboardAppearance: dark;
`;

const SendButton = styled(TouchableOpacity)<{ disabled: boolean }>`
  padding: 8px;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border-width: 0;
`;

const ScrollToBottomButton = styled(Animated.createAnimatedComponent(TouchableOpacity))`
  position: absolute;
  bottom: 15px;
  align-self: center;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.95);
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
  elevation: 5;
`;

const TypingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  padding-left: 8px;
`;

const TypingDots = styled.View`
  flex-direction: row;
  gap: 4px;
`;

const TypingDot = styled(Animated.View)`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.6);
`;

const AnimatedMessageWrapper = styled(Animated.View)<{ isFromUser: boolean }>`
  flex-direction: row;
  justify-content: ${props => props.isFromUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 12px;
  padding-horizontal: 4px;
`;

const FloatingTypingIndicatorContainer = styled.View`
  padding-left: 24px;
  padding-bottom: 8px;
  margin-bottom: 20px;
  z-index: 10;
`;

const FloatingTypingIndicator: React.FC = () => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    animationRef.current = Animated.loop(
      Animated.stagger(150, [
        Animated.sequence([
          Animated.timing(dot1Anim, { toValue: -8, duration: 350, useNativeDriver: true }),
          Animated.timing(dot1Anim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot2Anim, { toValue: -8, duration: 350, useNativeDriver: true }),
          Animated.timing(dot2Anim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot3Anim, { toValue: -8, duration: 350, useNativeDriver: true }),
          Animated.timing(dot3Anim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
      ])
    );
    
    animationRef.current.start();

    // Cleanup function to stop animation on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <FloatingTypingIndicatorContainer>
      <TypingDots>
        <TypingDot style={{ transform: [{ translateY: dot1Anim }] }} />
        <TypingDot style={{ transform: [{ translateY: dot2Anim }] }} />
        <TypingDot style={{ transform: [{ translateY: dot3Anim }] }} />
      </TypingDots>
    </FloatingTypingIndicatorContainer>
  );
};

const PortalOverlay = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const PortalGlow = styled(LinearGradient)`
  position: absolute;
  width: ${Dimensions.get('window').width * 1.5}px;
  height: ${Dimensions.get('window').height * 1.5}px;
  border-radius: ${Math.max(Dimensions.get('window').width, Dimensions.get('window').height)}px;
  opacity: 0.8;
  shadow-color: #cf30aa;
  shadow-offset: 0px 0px;
  shadow-opacity: 0.8;
  shadow-radius: 20px;
  elevation: 10;
`;

const PortalBlur = styled(BlurView)`
  position: absolute;
  width: ${Dimensions.get('window').width * 1.5}px;
  height: ${Dimensions.get('window').height * 1.5}px;
  border-radius: ${Math.max(Dimensions.get('window').width, Dimensions.get('window').height)}px;
  opacity: 0.7;
`;

export const ChatbotScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { messages, inputText, setInputText, isLoading, sendMessage, typingMessageId } = useChat(scrollViewRef);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current;

  // Portal animation state
  const [showPortal, setShowPortal] = useState(true);
  const portalScale = useRef(new Animated.Value(0.1)).current;
  const portalOpacity = useRef(new Animated.Value(1)).current;
  const portalRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // Animate scroll button visibility
  useEffect(() => {
    Animated.timing(scrollButtonOpacity, {
      toValue: showScrollButton ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showScrollButton]);

  useEffect(() => {
    if (showPortal) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(portalScale, {
            toValue: 1.5,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(portalRotation, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(portalOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(portalScale, {
            toValue: 3,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => setShowPortal(false));
    }
  }, [showPortal]);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height - 60;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <Background>
      <ChatErrorBoundary>
        <Container>
          {showPortal && (
            <PortalOverlay
              style={{
                opacity: portalOpacity,
                transform: [
                  { scale: portalScale },
                  { rotate: portalRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })}
                ],
              }}
              pointerEvents="none"
            >
              <PortalGlow
                colors={["#cf30aa", "#764ba2", "#18116a", "#cf30aa", "#ff6b9d", "#cf30aa"]}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.9, y: 0.9 }}
                locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
              />
              <PortalBlur intensity={60} tint="dark" />
            </PortalOverlay>
          )}
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <Header>
              <HeaderTitle>Nimbus AI</HeaderTitle>
            </Header>

            <View style={{ flex: 1 }}>
              <MessagesContainer
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 16, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {messages.map((message) => (
                  <MessageComponent 
                    key={message.id} 
                    message={message} 
                    isTyping={message.id === typingMessageId}
                  />
                ))}
              </MessagesContainer>
              
              <ScrollToBottomButton
                style={{ opacity: scrollButtonOpacity }}
                onPress={scrollToBottom}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-down" size={24} color="#000000" />
              </ScrollToBottomButton>
            </View>

            {isLoading && <FloatingTypingIndicator />}

            <InputContainer isKeyboardVisible={isKeyboardVisible}>
              <InputWrapper>
                <StyledTextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask me anything..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  multiline
                  textAlignVertical="top"
                  editable={true}
                  keyboardAppearance="dark"
                  autoCorrect={true}
                  autoCapitalize="sentences"
                  spellCheck={true}
                  textContentType="none"
                />
              </InputWrapper>
              <SendButton 
                disabled={!inputText.trim() || isLoading || !!typingMessageId}
                onPress={sendMessage}
              >
                <Ionicons 
                  name="send" 
                  size={16} 
                  color={!inputText.trim() || isLoading || !!typingMessageId ? "rgba(255, 255, 255, 0.3)" : "#ffffff"} 
                />
              </SendButton>
            </InputContainer>
          </KeyboardAvoidingView>
        </Container>
      </ChatErrorBoundary>
    </Background>
  );
}; 