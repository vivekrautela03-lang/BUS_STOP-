import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { api } from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { TransitStop } from '../../types';

interface Props {
  navigation: any;
  route?: any;
}

export const DriverActiveTripScreen: React.FC<Props> = ({ navigation, route }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stops, setStops] = useState<TransitStop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(1);
  const [speedKmh, setSpeedKmh] = useState<number>(44);
  const [isLiveTelemetry, setIsLiveTelemetry] = useState<boolean>(true);
  const [tripStatus, setTripStatus] = useState<'BOARDING' | 'IN_TRANSIT' | 'COMPLETED'>('IN_TRANSIT');

  useEffect(() => {
    const loadStops = async () => {
      try {
        const fetched = await api.getStops();
        setStops(fetched);
      } catch (err) {
        console.error('Error fetching stops:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStops();

    // Simulated GPS speed fluctuations for realistic cockpit feel
    const interval = setInterval(() => {
      setSpeedKmh(Math.floor(38 + Math.random() * 14));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleNextHalt = () => {
    if (currentStopIndex < stops.length - 1) {
      const nextIndex = currentStopIndex + 1;
      setCurrentStopIndex(nextIndex);
      Alert.alert(
        'Halt Reached',
        `Bus arrived at ${stops[nextIndex]?.name}. Door unlocking and automated halt chime triggered.`
      );
    } else {
      Alert.alert(
        'Final Destination Reached',
        'You have arrived at the terminal station. Would you like to close and complete this trip?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete Trip',
            onPress: () => {
              setTripStatus('COMPLETED');
              Alert.alert('Trip Completed', 'Manifest synced and trip archived successfully.');
            },
          },
        ]
      );
    }
  };

  const handleBroadcastAnnouncement = () => {
    Alert.alert(
      'Cabin Announcement',
      `"Dear Passengers, we are currently cruising at ${speedKmh} km/h approaching ${stops[currentStopIndex]?.name || 'Next Station'}. Please fasten your seat belts and keep your belongings secure."`
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Active Trip Cockpit" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner message="Calibrating GPS & route waypoints..." />
      </View>
    );
  }

  const currentStop = stops[currentStopIndex] || stops[0];
  const nextStop = stops[currentStopIndex + 1] || null;

  return (
    <View style={styles.container}>
      <Header
        title="Active Highway Trip"
        subtitle="Route #EXP-88 &#8226; Shimla - Manali Corridor"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <Badge
            label={isLiveTelemetry ? 'GPS LIVE' : 'GPS STALE'}
            variant={isLiveTelemetry ? 'success' : 'error'}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cockpit HUD Instrument */}
        <Card variant="elevated" style={styles.hudCard}>
          <View style={styles.hudRow}>
            <View style={styles.hudColumn}>
              <Text style={styles.hudLabel}>CURRENT SPEED</Text>
              <View style={styles.speedRow}>
                <Text style={styles.speedValue}>{speedKmh}</Text>
                <Text style={styles.speedUnit}>km/h</Text>
              </View>
              <Text style={styles.speedLimit}>Speed Limit: 60 km/h</Text>
            </View>

            <View style={styles.hudDivider} />

            <View style={styles.hudColumn}>
              <Text style={styles.hudLabel}>NEXT SCHEDULED HALT</Text>
              <Text style={styles.nextHaltName} numberOfLines={1}>
                {nextStop?.name || 'Terminal Station'}
              </Text>
              <Text style={styles.nextHaltEta}>ETA: ~18 mins (8.4 km)</Text>
            </View>
          </View>
        </Card>

        {/* Quick Action Cockpit Buttons */}
        <View style={styles.actionRow}>
          <Button
            title="Arrive at Next Halt"
            variant="primary"
            size="large"
            style={{ flex: 1, marginRight: spacing.xs }}
            onPress={handleNextHalt}
          />
          <Button
            title="📢 PA Chime"
            variant="outline"
            size="large"
            style={{ width: 110 }}
            onPress={handleBroadcastAnnouncement}
          />
        </View>

        {/* Live Passenger Load & Scanner Trigger */}
        <Card variant="outlined" style={styles.passengerCard}>
          <View style={styles.passengerHeader}>
            <View>
              <Text style={styles.passengerCount}>34 / 40 Booked</Text>
              <Text style={styles.passengerSub}>6 Empty Seats Available for Boarding</Text>
            </View>
            <Button
              title="Ticket Scan"
              variant="secondary"
              size="small"
              onPress={() => navigation.navigate('QrScanner')}
            />
          </View>
        </Card>

        {/* Stop Progression Timeline */}
        <Text style={styles.timelineHeader}>Route Waypoint Timeline</Text>
        <Card variant="elevated" style={styles.timelineCard}>
          {stops.map((stop, idx) => {
            const isPassed = idx < currentStopIndex;
            const isCurrent = idx === currentStopIndex;
            const isUpcoming = idx > currentStopIndex;

            return (
              <View key={stop.id} style={styles.timelineItem}>
                <View style={styles.timelineTrack}>
                  <View
                    style={[
                      styles.timelineDot,
                      isPassed && styles.dotPassed,
                      isCurrent && styles.dotCurrent,
                      isUpcoming && styles.dotUpcoming,
                    ]}
                  >
                    {isPassed && <Text style={styles.dotCheck}>✓</Text>}
                    {isCurrent && <View style={styles.dotPulse} />}
                  </View>
                  {idx < stops.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        isPassed ? styles.linePassed : styles.lineUpcoming,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.timelineDetails}>
                  <View style={styles.stopNameRow}>
                    <Text
                      style={[
                        styles.stopName,
                        isCurrent && styles.stopNameCurrent,
                      ]}
                    >
                      {stop.name}
                    </Text>
                    {isCurrent && <Badge label="BUS HERE" variant="success" />}
                  </View>
                  <Text style={styles.stopCity}>
                    {stop.city} &#8226; Halt #{idx + 1}
                  </Text>
                </View>
              </View>
            );
          })}
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
  hudCard: {
    backgroundColor: colors.navy,
    marginBottom: spacing.md,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudColumn: {
    flex: 1,
  },
  hudDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: spacing.md,
  },
  hudLabel: {
    ...typography.overline,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  speedValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
  },
  speedUnit: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  speedLimit: {
    ...typography.caption,
    color: colors.accentGold,
    marginTop: 2,
  },
  nextHaltName: {
    ...typography.h3,
    color: '#FFF',
  },
  nextHaltEta: {
    ...typography.caption,
    color: colors.primarySoft,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  passengerCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  passengerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerCount: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  passengerSub: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  timelineHeader: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  timelineCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineTrack: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 24,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPassed: {
    backgroundColor: colors.success,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primarySoft,
  },
  dotUpcoming: {
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotCheck: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  dotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  timelineLine: {
    width: 2,
    height: 44,
  },
  linePassed: {
    backgroundColor: colors.success,
  },
  lineUpcoming: {
    backgroundColor: colors.border,
  },
  timelineDetails: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stopNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  stopNameCurrent: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  stopCity: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
});
