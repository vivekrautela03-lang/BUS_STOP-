import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props {
  navigation: any;
}

export const DriverEarningsScreen: React.FC<Props> = ({ navigation }) => {
  const [period, setPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  const earnings = {
    today: {
      total: 1420,
      trips: 2,
      basePay: 800,
      kmAllowance: 420,
      safetyBonus: 200,
    },
    week: {
      total: 11480,
      trips: 14,
      basePay: 6400,
      kmAllowance: 3680,
      safetyBonus: 1400,
    },
    month: {
      total: 48950,
      trips: 58,
      basePay: 27000,
      kmAllowance: 15450,
      safetyBonus: 6500,
    },
  };

  const current = earnings[period === 'TODAY' ? 'today' : period === 'WEEK' ? 'week' : 'month'];

  return (
    <View style={styles.container}>
      <Header
        title="Captain Settlements"
        subtitle="Earnings & Mountain Hazard Allowance"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Period Selector Tabs */}
        <View style={styles.tabRow}>
          {(['TODAY', 'WEEK', 'MONTH'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                period === tab && styles.tabBtnActive,
              ]}
              onPress={() => setPeriod(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  period === tab && styles.tabTextActive,
                ]}
              >
                {tab === 'TODAY' ? 'Today' : tab === 'WEEK' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hero Earnings Card */}
        <Card variant="elevated" style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL NET EARNINGS</Text>
          <Text style={styles.heroAmount}>₹{current.total.toLocaleString()}</Text>
          <Text style={styles.heroSub}>{current.trips} completed corridor trips</Text>
          <View style={styles.payoutBadge}>
            <Badge label="DIRECT UPI SETTLEMENT" variant="success" />
          </View>
        </Card>

        {/* Earnings Breakdown */}
        <Text style={styles.sectionTitle}>Remuneration Breakdown</Text>
        <Card variant="outlined" style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Shift Honorarium</Text>
            <Text style={styles.breakdownValue}>₹{current.basePay.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>High Altitude Km Allowance</Text>
            <Text style={styles.breakdownValue}>₹{current.kmAllowance.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Zero-Incident Safety Bonus</Text>
            <Text style={[styles.breakdownValue, { color: colors.success }]}>
              +₹{current.safetyBonus.toLocaleString()}
            </Text>
          </View>
        </Card>

        {/* Settlement History */}
        <Text style={styles.sectionTitle}>Recent Bank Settlements</Text>
        <Card variant="elevated" style={styles.settlementItem}>
          <View style={styles.settlementHeader}>
            <View>
              <Text style={styles.settlementDate}>Yesterday &#8226; 12 Oct 2026</Text>
              <Text style={styles.settlementBank}>State Bank of India (••• 4491)</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.settlementAmount}>₹1,550</Text>
              <Badge label="TRANSFERRED" variant="success" />
            </View>
          </View>
        </Card>

        <Card variant="elevated" style={styles.settlementItem}>
          <View style={styles.settlementHeader}>
            <View>
              <Text style={styles.settlementDate}>11 Oct 2026</Text>
              <Text style={styles.settlementBank}>State Bank of India (••• 4491)</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.settlementAmount}>₹1,380</Text>
              <Badge label="TRANSFERRED" variant="success" />
            </View>
          </View>
        </Card>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.card,
    elevation: 2,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  tabTextActive: {
    color: colors.primary,
  },
  heroCard: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroLabel: {
    ...typography.overline,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFF',
  },
  heroSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  payoutBadge: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  breakdownCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  breakdownLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  breakdownValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  settlementItem: {
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settlementDate: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settlementBank: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  settlementAmount: {
    ...typography.body,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
});
