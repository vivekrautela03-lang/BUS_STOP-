// ============================================================================
// BUS STOP — LIVE MAP SCREEN (TRANSIT TELEMETRY)
// Real mountain route waypoints, intermediate halts, and live bus positions
// ============================================================================

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { FleetBus } from '../../types';

const WAYPOINTS = [
  { name: 'Dehradun (ISBT)', lat: 30.2885, lng: 78.0081, type: 'start' },
  { name: 'Prem Nagar', lat: 30.2550, lng: 78.0450, type: 'stop' },
  { name: 'Doiwala Junction', lat: 30.1780, lng: 78.1180, type: 'stop' },
  { name: 'Nepali Farm', lat: 30.0950, lng: 78.1800, type: 'waypoint' },
  { name: 'Haridwar Bypass', lat: 30.0150, lng: 78.1750, type: 'stop' },
  { name: 'Raiwala Bypass', lat: 30.0600, lng: 78.2300, type: 'waypoint' },
  { name: 'Rishikesh Terminal', lat: 30.1030, lng: 78.2930, type: 'end' },
];

interface LiveMapScreenProps {
  onSelectBus?: (bus: FleetBus) => void;
  navigation?: any;
}

export const LiveMapScreen: React.FC<LiveMapScreenProps> = ({ onSelectBus, navigation }) => {
  const [buses, setBuses] = useState<FleetBus[]>([]);
  const [selectedWaypoint, setSelectedWaypoint] = useState(WAYPOINTS[1]);

  useEffect(() => {
    api.getBuses().then(setBuses).catch(() => {});
    const interval = setInterval(() => {
      api.getBuses().then(setBuses).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Live Transit Radar" subtitle="Mountain Satellite Tracking" />

      {/* Map Radar Stage Card */}
      <View style={styles.mapStage}>
        {/* Floating live pill */}
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>LIVE SATELLITE GPS</Text>
        </View>

        {/* Visual Route Representation */}
        <View style={styles.radarGraphic}>
          <Text style={styles.radarIcon}>🏔️</Text>
          <Text style={styles.corridorBanner}>Dehradun ➔ Rishikesh Express (Route 108)</Text>
          <Text style={styles.telemetryText}>Active Corridor: 45 km • Topographic Mountain Waypoints</Text>

          {/* Stepper Progression */}
          <View style={styles.stepperContainer}>
            {WAYPOINTS.filter(w => w.type !== 'waypoint').map((wp, i) => (
              <TouchableOpacity 
                key={i} 
                style={[
                  styles.checkpointChip,
                  selectedWaypoint.name === wp.name && styles.checkpointActive
                ]}
                onPress={() => setSelectedWaypoint(wp)}
              >
                <Text style={styles.chipDot}>{wp.type === 'start' ? '🟢' : wp.type === 'end' ? '🔴' : '🔵'}</Text>
                <Text style={styles.chipText} numberOfLines={1}>{wp.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Active Buses Near Selected Halt */}
      <ScrollView contentContainerStyle={styles.scrollList}>
        <Text style={styles.sectionHeading}>Nearby Buses at {selectedWaypoint.name}</Text>

        {buses.map(bus => (
          <Card 
            key={bus.id} 
            style={styles.busCard}
            onPress={() => onSelectBus ? onSelectBus(bus) : navigation?.navigate('BusDetails', { bus })}
          >
            <View style={styles.busRow}>
              <View style={styles.busInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.busNum}>{bus.bus_number}</Text>
                  <Badge label="IN TRANSIT" variant="success" size="sm" />
                </View>
                <Text style={styles.busSub}>
                  Speed: {bus.speed || 48} km/h • Current Halt: {bus.current_stop || 'Prem Nagar'}
                </Text>
              </View>
              <View style={styles.etaCol}>
                <Text style={styles.etaNum}>{bus.eta_minutes || 5} min</Text>
                <Text style={styles.etaLabel}>ARRIVAL</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapStage: {
    height: 240,
    backgroundColor: colors.navy,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  livePill: {
    position: 'absolute',
    top: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  radarGraphic: {
    alignItems: 'center',
    marginTop: 20,
  },
  radarIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  corridorBanner: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  telemetryText: {
    fontSize: 11,
    color: colors.sky,
    marginTop: 2,
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  checkpointChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  checkpointActive: {
    backgroundColor: colors.primary,
  },
  chipDot: {
    fontSize: 10,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollList: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  sectionHeading: {
    fontSize: typography.fontSize.body,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: spacing.md,
  },
  busCard: {
    marginBottom: spacing.sm,
  },
  busRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  busNum: {
    fontSize: typography.fontSize.body,
    fontWeight: '800',
    color: colors.navy,
  },
  busSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  etaCol: {
    alignItems: 'flex-end',
  },
  etaNum: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  etaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
  },
});
