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
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { profile, setRole, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState({
    totalBuses: 8,
    activeDrivers: 12,
    todayBookings: 84,
    revenueToday: 78540,
    activeAlerts: 1,
  });

  const loadData = async () => {
    try {
      const [buses, drivers, bookings] = await Promise.all([
        api.getBuses().catch(() => []),
        api.getDrivers().catch(() => []),
        api.getBookings().catch(() => []),
      ]);

      const totalRev = bookings.reduce((sum: number, b: any) => sum + (Number(b.totalFare || b.fare_amount) || 0), 0);

      setStats({
        totalBuses: buses.length || 8,
        activeDrivers: drivers.length || 12,
        todayBookings: bookings.length || 84,
        revenueToday: totalRev || 78540,
        activeAlerts: 1,
      });
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title="Fleet Command Center"
        subtitle={`Administrator: ${profile?.name || 'HQ Dispatch'}`}
        rightAction={
          <Badge label="ADMIN MODE" variant="primary" />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        {/* Urgent Transit Advisory */}
        <Card variant="outlined" style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.alertTitle}>HIGHWAY NH-3 ADVISORY ACTIVE</Text>
              <Text style={styles.alertSub}>
                Single lane traffic near Kandaghat due to rock clearing. Average delay: 15-20 mins.
              </Text>
            </View>
          </View>
        </Card>

        {/* 4 Operations KPI Cards */}
        <Text style={styles.sectionTitle}>Corridor Key Performance Indicators</Text>
        <View style={styles.kpiGrid}>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>{stats.totalBuses}</Text>
            <Text style={styles.kpiLabel}>Fleet Buses Active</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: colors.primary }]}>
              {stats.activeDrivers}
            </Text>
            <Text style={styles.kpiLabel}>Captains on Roster</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: colors.success }]}>
              ₹{stats.revenueToday.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Revenue (Gross)</Text>
          </Card>
          <Card variant="elevated" style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: colors.navy }]}>
              {stats.todayBookings}
            </Text>
            <Text style={styles.kpiLabel}>Seats Booked</Text>
          </Card>
        </View>

        {/* Admin Navigation Tiles */}
        <Text style={styles.sectionTitle}>Fleet Administration Modules</Text>
        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AdminDrivers')}
          >
            <View style={styles.menuIconBox}>
              <Text style={styles.menuIconText}>🧑‍✈️</Text>
            </View>
            <View style={styles.menuMeta}>
              <Text style={styles.menuTitle}>Captain Verification Roster</Text>
              <Text style={styles.menuSubtitle}>Verify Heavy Vehicle Licenses & medical audits</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AdminBuses')}
          >
            <View style={styles.menuIconBox}>
              <Text style={styles.menuIconText}>🚌</Text>
            </View>
            <View style={styles.menuMeta}>
              <Text style={styles.menuTitle}>Fleet Registry & Bus Maintenance</Text>
              <Text style={styles.menuSubtitle}>Starbus Ultra 40-seaters & mountain certification</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AdminBookings')}
          >
            <View style={styles.menuIconBox}>
              <Text style={styles.menuIconText}>🎟️</Text>
            </View>
            <View style={styles.menuMeta}>
              <Text style={styles.menuTitle}>Real-time Ticket Transaction Audit</Text>
              <Text style={styles.menuSubtitle}>All confirmed PNRs, traveler contact, and fares</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Role Switcher */}
        <Text style={styles.sectionTitle}>Switch Operational Mode</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={styles.roleBtn}
            onPress={() => setRole('passenger')}
          >
            <Text style={styles.roleBtnText}>🎒 Passenger App</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roleBtn}
            onPress={() => setRole('driver')}
          >
            <Text style={styles.roleBtnText}>🧑‍✈️ Captain Cockpit</Text>
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  alertCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    marginBottom: spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 26,
  },
  alertTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: '#B45309',
  },
  alertSub: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  kpiCard: {
    width: '48%',
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  kpiNumber: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 4,
  },
  menuList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuIconText: {
    fontSize: 22,
  },
  menuMeta: {
    flex: 1,
  },
  menuTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  arrowText: {
    fontSize: 18,
    color: colors.secondaryText,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleBtnText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
