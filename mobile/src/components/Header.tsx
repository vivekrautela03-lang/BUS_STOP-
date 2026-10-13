// ============================================================================
// BUS STOP — DESIGN SYSTEM: SCREEN HEADER
// Consistent, responsive navigation header bar with brand mark & role badge
// ============================================================================

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  StatusBar 
} from 'react-native';
import { colors, typography, spacing } from '../theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  roleBadge?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  roleBadge,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftRow}>
          {showBack && onBack ? (
            <TouchableOpacity 
              onPress={onBack} 
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.brandRow}>
              <View style={styles.brandLogoCircle}>
                <Text style={styles.brandLogoText}>BS</Text>
              </View>
              <Text style={styles.brandText}>
                BUS <Text style={styles.brandHighlight}>STOP</Text>
              </Text>
            </View>
          )}

          {title ? (
            <View style={styles.titleCol}>
              <Text style={styles.screenTitle} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={styles.screenSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
          ) : null}
        </View>

        <View style={styles.rightRow}>
          {roleBadge ? (
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{roleBadge}</Text>
            </View>
          ) : null}
          {rightAction ? rightAction : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  brandLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  brandLogoText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandText: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandHighlight: {
    color: colors.primary,
  },
  titleCol: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  screenTitle: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rolePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rolePillText: {
    fontSize: typography.fontSize.tiny,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
});
