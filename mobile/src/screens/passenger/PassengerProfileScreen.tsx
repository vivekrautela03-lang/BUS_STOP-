// ============================================================================
// BUS STOP — PASSENGER PROFILE & MOUNTAIN TRAVELER PASS
// Profile credentials, role switching, app preferences, and logout
// ============================================================================

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export const PassengerProfileScreen: React.FC = () => {
  const { user, switchRole, logout } = useAuth();

  const handleRoleChange = (targetRole: 'driver' | 'admin') => {
    Alert.alert(
      `Switch to ${targetRole === 'driver' ? 'Fleet Captain' : 'Transit Admin'}`,
      `Would you like to switch your active mobile interface to ${targetRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Switch', 
          onPress: () => switchRole(targetRole)
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Disembark & Sign Out',
      'Are you sure you want to log out of your BUS STOP account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Citizen Traveler Pass" subtitle="Account & Mountain Transit Tier" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pass ID Card */}
        <View style={styles.passCard}>
          <View style={styles.passTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0) || 'T'}
              </Text>
            </View>
            <View style={styles.passMeta}>
              <Text style={styles.passName}>{user?.full_name || 'Scenic Mountain Traveler'}</Text>
              <Text style={styles.passTier}>Scenic Mountain Line • Citizen Traveler</Text>
              <Text style={styles.passId}>ID: UK-PASS-2026-9921</Text>
            </View>
          </View>

          <View style={styles.passDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ROUTE ACCESS</Text>
              <Text style={styles.statVal}>∞ All-Lines</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MOUNTAIN PASS</Text>
              <Text style={styles.statVal}>Active</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>GATE</Text>
              <Text style={styles.statVal}>Platform 1</Text>
            </View>
          </View>
        </View>

        {/* User Details */}
        <Text style={styles.sectionHeading}>Traveler Credentials</Text>
        <Card>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowVal}>{user?.email || 'traveler@busstop.transit'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Phone</Text>
            <Text style={styles.rowVal}>{user?.phone || '+91 98765 43210'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Home Depot</Text>
            <Text style={styles.rowVal}>{user?.home_location || 'Dehradun, Uttarakhand'}</Text>
          </View>
        </Card>

        {/* Role Switching */}
        <Text style={styles.sectionHeading}>Switch Operational Role</Text>
        <Card>
          <TouchableOpacity 
            style={styles.switchRow} 
            onPress={() => handleRoleChange('driver')}
          >
            <View style={styles.switchLeft}>
              <Text style={styles.switchIcon}>👨‍✈️</Text>
              <View>
                <Text style={styles.switchTitle}>Driver Captain Console</Text>
                <Text style={styles.switchSub}>Vehicle controls, QR scanning, stop progression</Text>
              </View>
            </View>
            <Text style={styles.switchArrow}>➔</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.switchRow} 
            onPress={() => handleRoleChange('admin')}
          >
            <View style={styles.switchLeft}>
              <Text style={styles.switchIcon}>⚙️</Text>
              <View>
                <Text style={styles.switchTitle}>Fleet Director / Admin</Text>
                <Text style={styles.switchSub}>Driver verification, buses, revenue audit</Text>
              </View>
            </View>
            <Text style={styles.switchArrow}>➔</Text>
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <Button 
          title="🚪 Disembark & Sign Out"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          style={styles.logoutBtn}
        />
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
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  passCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  passTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  passMeta: {
    flex: 1,
  },
  passName: {
    fontSize: typography.fontSize.heading,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  passTier: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.sky,
    marginTop: 2,
  },
  passId: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  passDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.sky,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: typography.fontSize.body,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    fontSize: typography.fontSize.bodySm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rowVal: {
    fontSize: typography.fontSize.bodySm,
    color: colors.navy,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  switchIcon: {
    fontSize: 24,
  },
  switchTitle: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '800',
    color: colors.navy,
  },
  switchSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  switchArrow: {
    fontSize: 16,
    color: colors.primary,
    paddingLeft: spacing.sm,
  },
  logoutBtn: {
    marginTop: spacing.xl,
  },
});
