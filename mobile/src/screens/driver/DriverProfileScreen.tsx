import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props {
  navigation: any;
}

export const DriverProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, profile, logout, setRole } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'End Shift & Sign Out',
      'Are you sure you want to clock out and sign out of the Captain Cockpit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleSwitchRole = (newRole: 'passenger' | 'admin') => {
    Alert.alert(
      'Switch Operational Mode',
      `Switching to ${newRole.toUpperCase()} view.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            await setRole(newRole);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Captain Profile" subtitle="Himachal Mountain Fleet Roster" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0) || 'C'}
              </Text>
            </View>
            <View style={styles.meta}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profile?.name || 'Captain Vikram'}</Text>
                <Badge label="VERIFIED CAPTAIN" variant="success" />
              </View>
              <Text style={styles.phone}>{profile?.phone || '+91 94180 56789'}</Text>
              <Text style={styles.email}>{user?.email || 'driver@busstop.in'}</Text>
            </View>
          </View>
        </Card>

        {/* Commercial License & Badge */}
        <Text style={styles.sectionTitle}>Transport Department Credentials</Text>
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Heavy Vehicle Driving License (HMV)</Text>
            <Text style={styles.infoValue}>
              {profile?.driverLicense || 'HP-01-2018-009941'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mountain Transit Captain Badge</Text>
            <Text style={styles.infoValue}>HP-STATE-CAPT-#442</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Annual Medical Fitness & Eye Check</Text>
            <Text style={[styles.infoValue, { color: colors.success }]}>
              VALID UNTIL OCT 2027
            </Text>
          </View>
        </Card>

        {/* Assigned Vehicle Details */}
        <Text style={styles.sectionTitle}>Assigned Fleet Vehicle</Text>
        <Card variant="elevated" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle Registration</Text>
            <Text style={styles.infoValue}>HP-01-EXP-9921</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chassis & Engine</Text>
            <Text style={styles.infoValue}>Tata Starbus Ultra 40-Seater</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Speed Governor Calibration</Text>
            <Text style={styles.infoValue}>Locked at 60 km/h (Mountain Spec)</Text>
          </View>
        </Card>

        {/* Role Switching */}
        <Text style={styles.sectionTitle}>Operational Role Switching</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={styles.roleBtn}
            onPress={() => handleSwitchRole('passenger')}
          >
            <Text style={styles.roleBtnText}>Switch to Passenger View 🎒</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roleBtn}
            onPress={() => handleSwitchRole('admin')}
          >
            <Text style={styles.roleBtnText}>Switch to Fleet Admin View 🏢</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutWrapper}>
          <Button
            title="End Shift & Sign Out"
            variant="danger"
            size="large"
            onPress={handleLogout}
          />
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
  profileCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  meta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  phone: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  email: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  infoRow: {
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    ...typography.overline,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  roleRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleBtn: {
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
  logoutWrapper: {
    marginTop: spacing.sm,
  },
});
