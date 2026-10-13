import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/passenger/HomeScreen';
import { BusDetailsScreen } from '../screens/passenger/BusDetailsScreen';
import { SeatSelectionScreen } from '../screens/passenger/SeatSelectionScreen';
import { TicketPassScreen } from '../screens/passenger/TicketPassScreen';
import { MyBookingsScreen } from '../screens/passenger/MyBookingsScreen';
import { LiveMapScreen } from '../screens/passenger/LiveMapScreen';
import { PassengerProfileScreen } from '../screens/passenger/PassengerProfileScreen';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PassengerHome" component={HomeScreen} />
    <Stack.Screen name="BusDetails" component={BusDetailsScreen} />
    <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
    <Stack.Screen name="TicketPass" component={TicketPassScreen} />
  </Stack.Navigator>
);

const BookingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BookingsList" component={MyBookingsScreen} />
    <Stack.Screen name="TicketPass" component={TicketPassScreen} />
  </Stack.Navigator>
);

export const PassengerTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          let icon = '🚌';
          if (route.name === 'ExploreTab') icon = '🔍';
          else if (route.name === 'MapTab') icon = '🗺️';
          else if (route.name === 'BookingsTab') icon = '🎟️';
          else if (route.name === 'ProfileTab') icon = '👤';

          return (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={styles.iconText}>{icon}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="ExploreTab"
        component={HomeStack}
        options={{ tabBarLabel: 'Buses' }}
      />
      <Tab.Screen
        name="MapTab"
        component={LiveMapScreen}
        options={{ tabBarLabel: 'Radar' }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsStack}
        options={{ tabBarLabel: 'My Trips' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={PassengerProfileScreen}
        options={{ tabBarLabel: 'Pass' }}
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
