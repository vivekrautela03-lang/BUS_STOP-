// ============================================================================
// BUS STOP — DESIGN SYSTEM: STATUS BADGE COMPONENT
// Pills for transit statuses: LIVE, ON DUTY, CONFIRMED, SCHEDULED, CANCELLED
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'live' | 'secondary';
  size?: 'sm' | 'md' | 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const isSmall = size === 'sm' || size === 'small';

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'success':
        return styles.successContainer;
      case 'warning':
        return styles.warningContainer;
      case 'error':
        return styles.errorContainer;
      case 'neutral':
      case 'secondary':
        return styles.neutralContainer;
      case 'live':
        return styles.liveContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'neutral':
      case 'secondary':
        return colors.textSecondary;
      case 'live':
        return colors.textWhite;
      case 'primary':
      default:
        return colors.primary;
    }
  };

  return (
    <View style={[
      styles.baseContainer, 
      getContainerStyle(), 
      isSmall && styles.smContainer,
      style
    ]}>
      {variant === 'live' && <View style={styles.livePulseDot} />}
      <Text style={[
        styles.baseText, 
        { color: getTextColor() },
        isSmall && styles.smText,
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  smContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  baseText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  smText: {
    fontSize: 10,
  },

  primaryContainer: {
    backgroundColor: colors.primaryLight,
  },
  successContainer: {
    backgroundColor: colors.successLight,
  },
  warningContainer: {
    backgroundColor: colors.warningLight,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
  },
  neutralContainer: {
    backgroundColor: colors.surfaceAlt,
  },
  liveContainer: {
    backgroundColor: colors.success,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textWhite,
    marginRight: 4,
  },
});
