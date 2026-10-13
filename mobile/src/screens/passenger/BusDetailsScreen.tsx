// ============================================================================
// BUS STOP — BUS DETAILS SCREEN
// Vehicle specifications, amenities, route timeline, live occupancy
// ============================================================================

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { FleetBus } from '../../types';

interface BusDetailsScreenProps {
  bus?: FleetBus;
  onBack?: () => void;
  onSelectSeats?: () => void;
  navigation?: any;
  route?: any;
}

const AMENITIES = [
  { icon: '❄️', name: 'Air Conditioned' },
  { icon: '💺', name: 'Push-back Seats' },
  { icon: '📍', name: 'GPS Live Tracking' },
  { icon: '🔋', name: 'USB Charging' },
  { icon: '💧', name: 'Water Bottle' },
  { icon: '🔨', name: 'Safety Hammer' },
];

const ROUTE_TIMELINE = [
  { name: 'Dehradun ISBT', time: '06:00 AM', status: 'completed' },
  { name: 'Prem Nagar', time: '08:30 AM', status: 'current' },
  { name: 'Doiwala Junction', time: '09:00 AM', status: 'upcoming' },
  { name: 'Haridwar Bypass', time: '09:40 AM', status: 'upcoming' },
  { name: 'Rishikesh Terminal', time: '10:30 AM', status: 'upcoming' },
];

export const BusDetailsScreen: React.FC<BusDetailsScreenProps> = ({
  bus: propBus,
  onBack,
  onSelectSeats,
  navigation,
  route,
}) => {
  const bus = propBus || route?.params?.bus || {
    id: 'bus-1',
    bus_number: 'HP-01-EXP-9921',
    route_name: 'Shimla Central → Manali Transit Terminal',
    capacity: 40,
    available_seats: 12,
    fare: 280,
    status: 'IN_TRANSIT',
    current_stop: 'Shoghi Bypass',
    next_stop: 'Kandaghat',
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigation?.goBack();
  };

  const handleSelectSeats = () => {
    if (onSelectSeats) onSelectSeats();
    else navigation?.navigate('SeatSelection', { bus });
  };
  return (
    <View style={styles.container}>
      <Header 
        title={bus.bus_number}
        subtitle={bus.route_name || 'Corridor Route 108'}
        showBack
        onBack={handleBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Specs Card */}
        <Card style={styles.specsCard}>
          <View style={styles.specsTopRow}>
            <View>
              <Text style={styles.carrierTitle}>Uttarakhand Parivahan (UTC)</Text>
              <Text style={styles.busModelName}>Tata Starbus Ultra 40S Express</Text>
            </View>
            <Badge label="IN SERVICE" variant="success" />
          </View>

          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>REGISTRATION</Text>
              <Text style={styles.specValue}>{bus.registration_number}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>TOTAL CAPACITY</Text>
              <Text style={styles.specValue}>{bus.capacity} Seats (2x2)</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>AVAILABLE SEATS</Text>
              <Text style={[styles.specValue, { color: colors.success }]}>
                {bus.available_seats} Seats
              </Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>BASE FARE</Text>
              <Text style={[styles.specValue, { color: colors.navy }]}>
                ₹{bus.fare}
              </Text>
            </View>
          </View>
        </Card>

        {/* Route Halts Timeline */}
        <Text style={styles.sectionHeading}>Corridor Halts & Arrival Timetable</Text>
        <Card style={styles.timelineCard}>
          {ROUTE_TIMELINE.map((halt, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <View style={styles.timelineLeftCol}>
                <View style={[
                  styles.timelineDot,
                  halt.status === 'completed' && styles.dotCompleted,
                  halt.status === 'current' && styles.dotCurrent,
                ]} />
                {idx < ROUTE_TIMELINE.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineRightCol}>
                <Text style={[
                  styles.haltName,
                  halt.status === 'current' && styles.haltNameCurrent,
                ]}>
                  {halt.name} {halt.status === 'current' ? '📍 (Live)' : ''}
                </Text>
                <Text style={styles.haltTime}>{halt.time}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Onboard Amenities */}
        <Text style={styles.sectionHeading}>Vehicle Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {AMENITIES.map((am, i) => (
            <View key={i} style={styles.amenityItem}>
              <Text style={styles.amenityIcon}>{am.icon}</Text>
              <Text style={styles.amenityText}>{am.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Bar with Fare & Action */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomFareLabel}>STANDARD TICKET FARE</Text>
          <Text style={styles.bottomFareAmount}>₹{bus.fare}</Text>
        </View>
        <Button 
          title="Select Seat & Book Pass ➔" 
          onPress={handleSelectSeats}
          size="lg"
          style={styles.bookButton}
        />
      </View>
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
    paddingBottom: 110,
  },
  specsCard: {
    marginBottom: spacing.lg,
  },
  specsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  carrierTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  busModelName: {
    fontSize: typography.fontSize.heading,
    fontWeight: '900',
    color: colors.navy,
    marginTop: 2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.md,
  },
  specBox: {
    width: '48%',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  specValue: {
    fontSize: typography.fontSize.body,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: '800',
    color: colors.navy,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  timelineCard: {
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 32,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  dotCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 2,
  },
  timelineRightCol: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.md,
  },
  haltName: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.navy,
  },
  haltNameCurrent: {
    color: colors.primary,
    fontWeight: '900',
  },
  haltTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  amenityItem: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  amenityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomFareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  bottomFareAmount: {
    fontSize: typography.fontSize.titleLg,
    fontWeight: '900',
    color: colors.navy,
  },
  bookButton: {
    paddingHorizontal: spacing.lg,
  },
});
