// ============================================================================
// BUS STOP — DESIGN SYSTEM: LOADING SPINNER
// Branded loading view with bus icon pulse and activity indicator
// ============================================================================

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading live mountain transit...',
  fullScreen = false,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.card}>
        <Text style={styles.busIcon}>🚍</Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 200,
  },
  busIcon: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  spinner: {
    marginVertical: spacing.sm,
  },
  message: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
