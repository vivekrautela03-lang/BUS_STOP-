// ============================================================================
// BUS STOP — DIGITAL VERIFIABLE TICKET PASS SCREEN
// Digital boarding pass with QR Code, PNR, seat number, and trip summary
// ============================================================================

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Share 
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { TicketBooking } from '../../types';

interface TicketPassScreenProps {
  booking?: TicketBooking;
  onDone?: () => void;
  navigation?: any;
  route?: any;
}

export const TicketPassScreen: React.FC<TicketPassScreenProps> = ({
  booking: propBooking,
  onDone,
  navigation,
  route,
}) => {
  const booking = propBooking || route?.params?.booking || {
    id: 'b-default',
    pnr: 'BSTP-992144',
    passenger_name: 'Scenic Mountain Traveler',
    bus_number: 'HP-01-EXP-9921',
    route_name: 'Shimla Central → Manali Transit Terminal',
    boarding_stop: 'Shimla Central Station',
    destination_stop: 'Manali Bus Terminal',
    seat_number: '4A',
    fare_amount: 280,
    departure_time: '08:30 AM',
    created_at: new Date().toISOString(),
  };

  const handleDone = () => {
    if (onDone) onDone();
    else navigation?.navigate('PassengerHome');
  };
  const handleShare = async () => {
    try {
      await Share.share({
        message: `BUS STOP Mountain Pass: PNR ${booking.pnr} for ${booking.passenger_name}. Seat ${booking.seat_number} on ${booking.route_name}. Safe travels!`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Digital Boarding Pass"
        subtitle="Verifiable Mountain Transit Pass"
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Header Banner */}
          <View style={styles.ticketHeader}>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>✓ VERIFIED DIGITAL PASS</Text>
            </View>
            <Text style={styles.carrierTitle}>Uttarakhand Parivahan (UTC)</Text>
            <Text style={styles.routeName}>{booking.route_name}</Text>
          </View>

          {/* Notch Cutouts */}
          <View style={styles.notchRow}>
            <View style={styles.leftNotch} />
            <View style={styles.dashedLine} />
            <View style={styles.rightNotch} />
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              {/* Geometric QR Simulation Matrix */}
              <View style={styles.qrCornerTopLeft} />
              <View style={styles.qrCornerTopRight} />
              <View style={styles.qrCornerBottomLeft} />
              <Text style={styles.qrCenterIcon}>🚏</Text>
              <Text style={styles.qrScanText}>SCAN TO BOARD</Text>
            </View>

            <Text style={styles.pnrLabel}>TICKET REFERENCE (PNR)</Text>
            <Text style={styles.pnrValue}>{booking.pnr}</Text>
          </View>

          {/* Trip Details Matrix */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>PASSENGER</Text>
              <Text style={styles.detailValue}>{booking.passenger_name}</Text>
            </View>
            <View style={styles.detailItemRight}>
              <Text style={styles.detailLabel}>ASSIGNED SEAT</Text>
              <Text style={styles.seatValue}>{booking.seat_number}</Text>
            </View>

            <View style={styles.fullWidthDivider} />

            <View style={styles.stopTimeline}>
              <View style={styles.stopRow}>
                <Text style={styles.stopPinGreen}>📍</Text>
                <View>
                  <Text style={styles.stopSub}>BOARDING HALT</Text>
                  <Text style={styles.stopMain}>{booking.boarding_stop}</Text>
                </View>
              </View>

              <View style={styles.stopRow}>
                <Text style={styles.stopPinRed}>🏁</Text>
                <View>
                  <Text style={styles.stopSub}>DESTINATION</Text>
                  <Text style={styles.stopMain}>{booking.destination_stop}</Text>
                </View>
              </View>
            </View>

            <View style={styles.fullWidthDivider} />

            <View style={styles.fareStatusRow}>
              <View>
                <Text style={styles.detailLabel}>FARE PAID</Text>
                <Text style={styles.fareAmount}>₹{booking.fare_amount.toFixed(2)}</Text>
              </View>
              <Badge label={booking.status} variant="success" />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button 
            title="Share Pass 📤" 
            onPress={handleShare}
            variant="outline"
            style={styles.shareBtn}
          />
          <Button 
            title="Done & Track Bus ➔" 
            onPress={handleDone}
            style={styles.doneBtn}
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
    marginBottom: spacing.xl,
  },
  ticketHeader: {
    backgroundColor: colors.navy,
    padding: spacing.xl,
    alignItems: 'center',
  },
  verifiedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: spacing.sm,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 1,
  },
  carrierTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.sky,
  },
  routeName: {
    fontSize: typography.fontSize.heading,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },
  notchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 28,
  },
  leftNotch: {
    width: 14,
    height: 28,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: colors.background,
  },
  rightNotch: {
    width: 14,
    height: 28,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: colors.background,
  },
  dashedLine: {
    flex: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  qrBox: {
    width: 160,
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  qrCenterIcon: {
    fontSize: 48,
  },
  qrScanText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
    letterSpacing: 1,
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: colors.navy,
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: colors.navy,
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 24,
    height: 24,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.navy,
  },
  pnrLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  pnrValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.navy,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  detailsGrid: {
    backgroundColor: colors.surfaceAlt,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailItem: {
    marginBottom: spacing.sm,
  },
  detailItemRight: {
    alignItems: 'flex-end',
    marginTop: -42,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: typography.fontSize.body,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 2,
  },
  seatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.success,
  },
  fullWidthDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  stopTimeline: {
    gap: spacing.sm,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stopPinGreen: {
    fontSize: 18,
  },
  stopPinRed: {
    fontSize: 18,
  },
  stopSub: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stopMain: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '700',
    color: colors.navy,
  },
  fareStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareAmount: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: '900',
    color: colors.navy,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shareBtn: {
    flex: 1,
  },
  doneBtn: {
    flex: 1.4,
  },
});
