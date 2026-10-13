import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverDashboardScreen } from '../screens/driver/DriverDashboardScreen';
import { DriverActiveTripScreen } from '../screens/driver/DriverActiveTripScreen';
import { PreTripChecklistModal } from '../screens/driver/PreTripChecklistModal';
import { QrScannerScreen } from '../screens/driver/QrScannerScreen';
import { CabinLayoutScreen } from '../screens/driver/CabinLayoutScreen';
import { PassengerManifestScreen } from '../screens/driver/PassengerManifestScreen';
import { IncidentReportScreen } from '../screens/driver/IncidentReportScreen';
import { DriverEarningsScreen } from '../screens/driver/DriverEarningsScreen';
import { DriverProfileScreen } from '../screens/driver/DriverProfileScreen';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CockpitStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} />
    <Stack.Screen name="DriverActiveTrip" component={DriverActiveTripScreen} />
    <Stack.Screen name="PreTripChecklist" component={PreTripChecklistModal} />
    <Stack.Screen name="QrScanner" component={QrScannerScreen} />
    <Stack.Screen name="CabinLayout" component={CabinLayoutScreen} />
    <Stack.Screen name="IncidentReport" component={IncidentReportScreen} />
  </Stack.Navigator>
);

export const DriverTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          let icon = '🧑‍✈️';
          if (route.name === 'CockpitTab') icon = '☸';
          else if (route.name === 'ManifestTab') icon = '📋';
          else if (route.name === 'ScannerTab') icon = '📷';
          else if (route.name === 'EarningsTab') icon = '💰';
          else if (route.name === 'CaptainProfileTab') icon = '👤';

          return (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={styles.iconText}>{icon}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="CockpitTab"
        component={CockpitStack}
        options={{ tabBarLabel: 'Cockpit' }}
      />
      <Tab.Screen
        name="ManifestTab"
        component={PassengerManifestScreen}
        options={{ tabBarLabel: 'Manifest' }}
      />
      <Tab.Screen
        name="ScannerTab"
        component={QrScannerScreen}
        options={{ tabBarLabel: 'Scan QR' }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={DriverEarningsScreen}
        options={{ tabBarLabel: 'Earnings' }}
      />
      <Tab.Screen
        name="CaptainProfileTab"
        component={DriverProfileScreen}
        options={{ tabBarLabel: 'Captain' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  iconActive: {
    transform: [{ scale: 1.15 }],
  },
  iconText: {
    fontSize: 20,
  },
});
