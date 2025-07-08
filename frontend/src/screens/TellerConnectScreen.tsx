import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';

import { AuthButton } from '../components/AuthButton';
import { Background } from '../components/Background';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { getNonce, connectAccount, getConnectConfig } from '../api/tellerService';
import { TellerSuccessPayload } from '../types/teller';
import { useAuth } from '../contexts/AuthContext';

// Get the App ID from environment variables or hardcode for now
const TELLER_APP_ID = process.env.EXPO_PUBLIC_TELLER_APP_ID || 'app_pf53ae2brofp6upddo000';
const TELLER_ENVIRONMENT = process.env.EXPO_PUBLIC_TELLER_ENVIRONMENT || 'sandbox';

/**
 * Generates the HTML and JavaScript for the Teller Connect WebView.
 * This function creates a self-contained HTML document that initializes
 * and opens Teller Connect immediately upon loading.
 */
const generateTellerHtml = (nonce: string) => {
  const config = {
    applicationId: TELLER_APP_ID,
    environment: TELLER_ENVIRONMENT,
    products: ['transactions', 'balance', 'identity'],
    selectAccount: 'multiple',
    nonce: nonce,
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.teller.io/connect/connect.js"></script>
        <style>
          body { margin: 0; padding: 0; background-color: #111827; }
        </style>
      </head>
      <body>
        <script>
          try {
            const tellerConnect = TellerConnect.setup({
              ...${JSON.stringify(config)},
              onSuccess: function(enrollment) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', payload: enrollment }));
              },
              onExit: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'exit' }));
              },
              onFailure: function(failure) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'failure', payload: failure }));
              }
            });
            tellerConnect.open();
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'error', payload: { message: e.message } }));
          }
        </script>
      </body>
    </html>
  `;
};


type TellerConnectScreenRouteProp = RouteProp<AuthStackParamList, 'TellerConnect'>;

export const TellerConnectScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<TellerConnectScreenRouteProp>();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showTellerModal, setShowTellerModal] = useState(false);
  const [tellerHtml, setTellerHtml] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);

  const webviewRef = useRef<WebView>(null);

  const handleConnectPress = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch a secure nonce from the backend
      const { nonce: fetchedNonce } = await getNonce();
      
      // 2. Store it in state and generate the HTML
      setNonce(fetchedNonce);
      const html = generateTellerHtml(fetchedNonce);
      setTellerHtml(html);

      // 3. Open the WebView modal
      setShowTellerModal(true);
    } catch (error) {
      console.error("Failed to start Teller Connect flow:", error);
      Alert.alert("Error", "Could not start the connection process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTellerSuccess = async (payload: TellerSuccessPayload) => {
    setShowTellerModal(false);
    setIsLoading(true);
    try {
      // Send the enrollment data and nonce to our backend
      await connectAccount(payload, nonce);
      
      // Call the onSuccess callback if provided (from signup flow)
      if (route.params?.onSuccess) {
        await route.params.onSuccess();
      } else {
        // If no callback provided, just go back
        const canGoBack = navigation.canGoBack();
        if (canGoBack) {
          navigation.goBack();
        }
      }
    } catch (error: any) {
      console.error("Failed to connect account on backend:", error);
      Alert.alert(
        "Connection Failed", 
        error.message || "An unknown error occurred while saving your connection."
      );
      setIsLoading(false);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.event) {
        case 'success':
          handleTellerSuccess(data.payload);
          break;
        case 'exit':
          setShowTellerModal(false);
          break;
        case 'failure':
          console.error('Teller Connect Failure:', data.payload);
          Alert.alert('Connection Failed', data.payload.message || 'An unknown error occurred in the connection flow.');
          setShowTellerModal(false);
          break;
        case 'error':
          console.error('Teller Connect Error:', data.payload);
          Alert.alert('Error', 'An unexpected error occurred. Please try again.');
          setShowTellerModal(false);
          break;
      }
    } catch (e) {
      console.error('Failed to parse message from WebView', e);
    }
  };

  const handleSkip = async () => {
    // Call the onSuccess callback if provided (from signup flow)
    if (route.params?.onSuccess) {
      await route.params.onSuccess();
    } else {
      // If no callback provided, just go back
      const canGoBack = navigation.canGoBack();
      if (canGoBack) {
        navigation.goBack();
      }
    }
  };

  return (
    <Background>
      <Container>
        <BlurCard>
          <IconCircle>
            <Ionicons name="shield-checkmark" size={48} color="#4fd1c5" />
          </IconCircle>
          <HeaderTitle>Connect Your Bank</HeaderTitle>
          <BodyText>
            Securely link your bank account to see your full financial picture, track spending, and get personalized insights.
          </BodyText>
          <AuthButton
            title={isLoading ? 'Connecting...' : 'Connect Account'}
            variant="primary"
            onPress={handleConnectPress}
            disabled={isLoading}
          />
          <SkipLink disabled={isLoading} onPress={handleSkip}>
            <SkipLinkText>Skip for Now</SkipLinkText>
          </SkipLink>
        </BlurCard>
        
        <Modal
          visible={showTellerModal}
          animationType="slide"
          onRequestClose={() => setShowTellerModal(false)}
        >
          <ModalContainer>
            <ModalHeader>
              <CloseButton onPress={() => setShowTellerModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </CloseButton>
            </ModalHeader>
            {tellerHtml ? (
              <WebView
                ref={webviewRef}
                source={{ html: tellerHtml, baseUrl: 'https://teller.io' }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                sharedCookiesEnabled={true} // iOS
                thirdPartyCookiesEnabled={true} // Android
                originWhitelist={['https://*']}
                setSupportMultipleWindows={false}
                androidLayerType="hardware"
                userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
                style={{ flex: 1, backgroundColor: '#111827' }}
                startInLoadingState={true}
                renderLoading={() => <LoadingIndicator />}
              />
            ) : <LoadingIndicator />}
          </ModalContainer>
        </Modal>
      </Container>
    </Background>
  );
};

// --- Styled Components ---

const LoadingIndicator = () => (
  <LoadingOverlay>
    <ActivityIndicator size="large" color="#4fd1c5" />
  </LoadingOverlay>
);

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const BlurCard = styled.View`
  width: 100%;
  max-width: 400px;
  border-radius: 28px;
  overflow: hidden;
  padding: 32px 24px 24px 24px;
  align-items: center;
  background-color: rgba(30, 41, 59, 0.5);
`;

const IconCircle = styled.View`
  width: 72px;
  height: 72px;
  border-radius: 36px;
  background-color: rgba(79, 209, 197, 0.12);
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
`;

const BodyText = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  margin-bottom: 32px;
`;

const SkipLink = styled.TouchableOpacity`
  margin-top: 18px;
`;

const SkipLinkText = styled.Text`
  color: #4fd1c5;
  font-size: 16px;
  text-align: center;
`;

// Modal Styles
const ModalContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: #111827;
`;

const ModalHeader = styled.View`
  height: 56px;
  justify-content: center;
  align-items: flex-end;
  padding-right: 16px;
`;

const CloseButton = styled(TouchableOpacity)`
  padding: 8px;
`;

const LoadingOverlay = styled.View`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #111827;
  justify-content: center;
  align-items: center;
  z-index: 10;
`; 