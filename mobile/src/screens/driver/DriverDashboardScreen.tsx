import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { DriverShiftState, FleetBus, TransitRoute } from '../../types';

interface Props {
  navigation: any;
}

export const DriverDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [shiftState, setShiftState] = useState<DriverShiftState | null>(null);
  const [assignedBus, setAssignedBus] = useState<FleetBus | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<TransitRoute | null>(null);

  const fetchDashboardData = async () => {
    try {
      const state = await api.getDriverShiftState(user?.id);
      setShiftState(state);
      setIsOnline(state.dutyStatus === 'ON_DUTY');

      const buses = await api.getBuses();
      if (buses.length > 0) {
        setAssignedBus(buses[0]);
      }

      const routes = await api.getRoutes();
      if (routes.length > 0) {
        setAssignedRoute(routes[0]);
      }
    } catch (err) {
      console.error('Failed to load driver dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleDuty = async () => {
    const nextStatus = isOnline ? 'OFF_DUTY' : 'ON_DUTY';
    try {
      await api.updateDriverDuty(user?.id || 'demo-driver', nextStatus);
      setIsOnline(!isOnline);
      if (shiftState) {
        setShiftState({ ...shiftState, dutyStatus: nextStatus });
      }
      Alert.alert(
        nextStatus === 'ON_DUTY' ? 'Duty Started' : 'Duty Off',
        nextStatus === 'ON_DUTY'
          ? 'You are now marked ON DUTY. GPS telemetry and trip scheduling active.'
          : 'You are now marked OFF DUTY. Have a good rest!'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update duty status');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Captain Cockpit" />
        <LoadingSpinner message="Connecting to fleet dispatch..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Captain Cockpit"
        subtitle={`Captain ${profile?.name || 'Commander'}`}
        rightAction={
          <TouchableOpacity
            style={[
              styles.dutyToggle,
              isOnline ? styles.dutyOnline : styles.dutyOffline,
            ]}
            onPress={handleToggleDuty}
          >
            <View
              style={[
                styles.dutyDot,
                { backgroundColor: isOnline ? colors.success : colors.secondaryText },
              ]}
            />
            <Text
              style={[
                styles.dutyText,
                { color: isOnline ? colors.success : colors.secondaryText },
              ]}
            >
              {isOnline ? 'ON DUTY' : 'OFF DUTY'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDashboardData();
            }}
          />
        }
      >
        {/* Active Bus & Corridor Hero */}
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.vehicleCode}>
                {assignedBus?.registrationNumber || 'HP-01-EXP-9921'}
              </Text>
              <Text style={styles.vehicleModel}>
                {assignedBus?.model || 'Tata Starbus Ultra (Mountain Edition)'}
              </Text>
            </View>
            <Badge
              label={shiftState?.currentTripStatus || 'SCHEDULED'}
              variant={shiftState?.currentTripStatus === 'IN_PROGRESS' ? 'success' : 'primary'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.routeSection}>
            <Text style={styles.sectionLabel}>ASSIGNED CORRIDOR</Text>
            <Text style={styles.corridorName}>
              {assignedRoute?.name || 'Shimla Central → Manali Transit Terminal'}
            </Text>
            <Text style={styles.corridorSub}>
              {assignedRoute?.totalDistanceKm || 260} km &#8226; Mountain NH-3 Highway
            </Text>
          </View>

          <View style={styles.heroActions}>
            <Button
              title="Enter Active Trip View"
              variant="primary"
              size="large"
              style={{ flex: 1, marginRight: spacing.xs }}
              onPress={() => navigation.navigate('DriverActiveTrip', { bus: assignedBus, route: assignedRoute })}
            />
            <Button
              title="Scan QR"
              variant="outline"
              size="large"
              style={{ width: 100 }}
              onPress={() => navigation.navigate('QrScanner')}
            />
          </View>
        </Card>

        {/* 4 Operations KPI Cards */}
        <Text style={styles.sectionTitle}>Today's Operational Metrics</Text>
        <View style={styles.metricsGrid}>
          <Card variant="outlined" style={styles.metricCard}>
            <Text style={styles.metricNumber}>{shiftState?.todayTrips || 2}</Text>
            <Text style={styles.metricLabel}>Assigned Trips</Text>
          </Card>
          <Card variant="outlined" style={styles.metricCard}>
            <Text style={[styles.metricNumber, { color: colors.primary }]}>
              {shiftState?.passengersCarried || 68}
            </Text>
            <Text style={styles.metricLabel}>Travelers Carried</Text>
          </Card>
          <Card variant="outlined" style={styles.metricCard}>
            <Text style={[styles.metricNumber, { color: colors.success }]}>
              ₹{shiftState?.earningsToday || 1420}
            </Text>
            <Text style={styles.metricLabel}>Daily Earnings</Text>
          </Card>
          <Card variant="outlined" style={styles.metricCard}>
            <Text style={[styles.metricNumber, { color: colors.accentGold }]}>
              ★ {shiftState?.rating || '4.92'}
            </Text>
            <Text style={styles.metricLabel}>Safety Rating</Text>
          </Card>
        </View>

        {/* Quick Driver Tools */}
        <Text style={styles.sectionTitle}>Fleet Cockpit Tools</Text>
        <View style={styles.toolsList}>
          <TouchableOpacity
            style={styles.toolItem}
            onPress={() => navigation.navigate('PassengerManifest')}
          >
            <View style={styles.toolIconBox}>
              <Text style={styles.toolIconText}>📋</Text>
            </View>
            <View style={styles.toolMeta}>
              <Text style={styles.toolTitle}>Passenger Boarding Manifest</Text>
              <Text style={styles.toolSubtitle}>Halt-by-halt confirmed travelers & contact info</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolItem}
            onPress={() => navigation.navigate('CabinLayout')}
          >
            <View style={styles.toolIconBox}>
              <Text style={styles.toolIconText}>💺</Text>
            </View>
            <View style={styles.toolMeta}>
              <Text style={styles.toolTitle}>Cabin Seat Occupancy (40 Seats)</Text>
              <Text style={styles.toolSubtitle}>Live 2x2 layout with luggage & special assist</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolItem}
            onPress={() => navigation.navigate('PreTripChecklist')}
          >
            <View style={styles.toolIconBox}>
              <Text style={styles.toolIconText}>🛡️</Text>
            </View>
            <View style={styles.toolMeta}>
              <Text style={styles.toolTitle}>Pre-Trip Safety Inspection</Text>
              <Text style={styles.toolSubtitle}>6-Point mountain safety and brake protocol</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolItem}
            onPress={() => navigation.navigate('IncidentReport')}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.toolIconText}>⚠️</Text>
            </View>
            <View style={styles.toolMeta}>
              <Text style={[styles.toolTitle, { color: colors.error }]}>Report Highway Incident</Text>
              <Text style={styles.toolSubtitle}>Broadcast landslide, congestion, or breakdown</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  dutyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  dutyOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  dutyOffline: {
    backgroundColor: colors.lightGray,
    borderColor: colors.border,
  },
  dutyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dutyText: {
    ...typography.caption,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleCode: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  vehicleModel: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  routeSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  corridorName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  corridorSub: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: '48%',
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricNumber: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 4,
  },
  toolsList: {
    gap: spacing.sm,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  toolIconText: {
    fontSize: 22,
  },
  toolMeta: {
    flex: 1,
  },
  toolTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toolSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  arrowText: {
    fontSize: 18,
    color: colors.secondaryText,
    fontWeight: '600',
  },
});
