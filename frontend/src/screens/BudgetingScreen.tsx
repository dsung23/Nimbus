import React from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { Background } from '../components/Background';

const Container = styled.View`
  flex: 1;
  padding: 20px;
`;

const ContentContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
`;

const IconContainer = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 32px;
`;

const Icon = styled(Ionicons)`
  color: rgba(255, 255, 255, 0.7);
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.Text`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  line-height: 26px;
  max-width: 280px;
`;

const FeatureList = styled.View`
  margin-top: 40px;
  align-items: center;
`;

const FeatureItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FeatureIcon = styled(Ionicons)`
  color: rgba(255, 255, 255, 0.6);
  margin-right: 12px;
`;

const FeatureText = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

export const BudgetingScreen: React.FC = () => {
  return (
    <Background>
      <Container>
        <ContentContainer>
          <IconContainer>
            <Icon name="wallet" size={48} />
          </IconContainer>
          
          <Title>Coming Soon</Title>
          
          <Subtitle>
            Smart budgeting features to help you track spending, set goals, and achieve financial freedom.
          </Subtitle>
          
          <FeatureList>
            <FeatureItem>
              <FeatureIcon name="trending-up" size={20} />
              <FeatureText>AI Powered Spending Analytics</FeatureText>
            </FeatureItem>
            
            <FeatureItem>
              <FeatureIcon name="target" size={20} />
              <FeatureText>Budget Goals</FeatureText>
            </FeatureItem>
            
            <FeatureItem>
              <FeatureIcon name="notifications" size={20} />
              <FeatureText>Smart Alerts</FeatureText>
            </FeatureItem>
            
            <FeatureItem>
              <FeatureIcon name="pie-chart" size={20} />
              <FeatureText>Category Insights</FeatureText>
            </FeatureItem>
          </FeatureList>
        </ContentContainer>
      </Container>
    </Background>
  );
}; 