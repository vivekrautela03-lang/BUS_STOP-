import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { PassengerTabs } from './PassengerTabs';
import { DriverTabs } from './DriverTabs';
import { AdminTabs } from './AdminTabs';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, role, loading, hasSeenOnboarding } = useAuth();

  if (loading) {
    return <SplashScreen onFinish={() => {}} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            {!hasSeenOnboarding && (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : role === 'driver' ? (
          <Stack.Screen name="DriverApp" component={DriverTabs} />
        ) : role === 'admin' ? (
          <Stack.Screen name="AdminApp" component={AdminTabs} />
        ) : (
          <Stack.Screen name="PassengerApp" component={PassengerTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
