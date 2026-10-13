import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminDriversScreen } from '../screens/admin/AdminDriversScreen';
import { AdminBusesScreen } from '../screens/admin/AdminBusesScreen';
import { AdminBookingsScreen } from '../screens/admin/AdminBookingsScreen';
import { PassengerProfileScreen } from '../screens/passenger/PassengerProfileScreen';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="AdminDrivers" component={AdminDriversScreen} />
    <Stack.Screen name="AdminBuses" component={AdminBusesScreen} />
    <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} />
  </Stack.Navigator>
);

export const AdminTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          let icon = '🏢';
          if (route.name === 'CommandTab') icon = '📊';
          else if (route.name === 'DriversTab') icon = '🧑‍✈️';
          else if (route.name === 'FleetTab') icon = '🚌';
          else if (route.name === 'LedgerTab') icon = '🎟️';
          else if (route.name === 'AdminProfileTab') icon = '👤';

          return (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={styles.iconText}>{icon}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="CommandTab"
        component={AdminStack}
        options={{ tabBarLabel: 'Command' }}
      />
      <Tab.Screen
        name="DriversTab"
        component={AdminDriversScreen}
        options={{ tabBarLabel: 'Captains' }}
      />
      <Tab.Screen
        name="FleetTab"
        component={AdminBusesScreen}
        options={{ tabBarLabel: 'Buses' }}
      />
      <Tab.Screen
        name="LedgerTab"
        component={AdminBookingsScreen}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="AdminProfileTab"
        component={PassengerProfileScreen}
        options={{ tabBarLabel: 'Account' }}
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
