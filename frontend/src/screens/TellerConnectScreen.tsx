import React, { useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthButton } from '../components/AuthButton';
import { Background } from '../components/Background';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { RouteProp } from '@react-navigation/native';

// Placeholder interface for Teller enrollment
export interface TellerEnrollment {
  accessToken: string;
  institution: { name: string };
  account: { id: string };
}

// Placeholder API function
const sendEnrollmentToBackend = async (
  enrollment: TellerEnrollment
): Promise<{ success: boolean }> => {
  console.log('Simulating API call to save enrollment to our backend...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true };
};

// Placeholder Teller Connect component
const TellerConnectPlaceholder: React.FC<{
  onSuccess: (enrollment: TellerEnrollment) => void;
  onExit: () => void;
}> = ({ onSuccess, onExit }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSuccess({
        accessToken: 'fake-access-token',
        institution: { name: 'Demo Bank' },
        account: { id: 'account-123' },
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <ModalOverlay>
      <ModalContent>
        <Ionicons name="shield-checkmark" size={48} color="#4fd1c5" style={{ marginBottom: 16 }} />
        <ModalTitle>Connecting to Teller...</ModalTitle>
        <ActivityIndicator size="large" color="#4fd1c5" style={{ marginVertical: 16 }} />
        <ModalText>This is a placeholder for the Teller Connect flow.</ModalText>
        <ModalButton onPress={onExit}>
          <ModalButtonText>Cancel</ModalButtonText>
        </ModalButton>
      </ModalContent>
    </ModalOverlay>
  );
};

type TellerConnectScreenRouteProp = RouteProp<AuthStackParamList, 'TellerConnect'>;

export const TellerConnectScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<TellerConnectScreenRouteProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [showTellerConnect, setShowTellerConnect] = useState(false);

  const handleTellerSuccess = async (enrollment: TellerEnrollment) => {
    console.log('Successfully received enrollment from Teller:', enrollment);
    setIsLoading(true);
    try {
      await sendEnrollmentToBackend(enrollment);
      // Call the onSuccess callback if it exists
      if (route.params?.onSuccess) {
        await route.params.onSuccess();
      } else {
        // Fallback to resetting navigation if no callback is provided
        navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
      }
    } catch (error) {
      // Handle backend error (show alert, etc.)
      setShowTellerConnect(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    // Also call onSuccess on skip to ensure sign-in
    if (route.params?.onSuccess) {
      await route.params.onSuccess();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
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
            See your full financial picture, track spending, and get personalized insights by securely linking your bank account.
          </BodyText>
          <AuthButton
            title={isLoading ? 'Connecting...' : 'Connect Account'}
            variant="primary"
            onPress={() => {
              if (!isLoading) setShowTellerConnect(true);
            }}
          />
          <SkipLink disabled={isLoading} onPress={handleSkip}>
            <SkipLinkText>Skip for Now</SkipLinkText>
          </SkipLink>
        </BlurCard>
        {showTellerConnect && (
          <TellerConnectPlaceholder
            onSuccess={handleTellerSuccess}
            onExit={() => setShowTellerConnect(false)}
          />
        )}
      </Container>
    </Background>
  );
};

// Styled Components
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
  text-decoration: underline;
`;

// Modal Placeholder Styles
const ModalOverlay = styled.View`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.45);
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

const ModalContent = styled.View`
  background-color: #1a1a1a;
  border-radius: 20px;
  padding: 32px 24px;
  align-items: center;
  width: 90%;
  max-width: 340px;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
`;

const ModalText = styled.Text`
  color: rgba(255,255,255,0.8);
  font-size: 15px;
  text-align: center;
  margin-bottom: 16px;
`;

const ModalButton = styled.TouchableOpacity`
  margin-top: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  background-color: rgba(255,255,255,0.08);
`;

const ModalButtonText = styled.Text`
  color: #4fd1c5;
  font-size: 16px;
  font-weight: 500;
`; 