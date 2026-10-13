// ============================================================================
// BUS STOP — MY BOOKINGS SCREEN
// Passenger booking history, active mountain passes, and cancellation
// ============================================================================

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  RefreshControl 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { api } from '../../services/api';
import { TicketBooking } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface MyBookingsScreenProps {
  onSelectBooking?: (booking: TicketBooking) => void;
  onExplore?: () => void;
  navigation?: any;
}

export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({
  onSelectBooking,
  onExplore,
  navigation,
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<TicketBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleSelectBooking = (item: TicketBooking) => {
    if (onSelectBooking) onSelectBooking(item);
    else navigation?.navigate('TicketPass', { booking: item });
  };

  const handleExplore = () => {
    if (onExplore) onExplore();
    else navigation?.navigate('ExploreTab');
  };

  const fetchBookings = async () => {
    try {
      if (user?.id) {
        const data = await api.getUserBookings(user.id);
        setBookings(data);
      }
    } catch (err) {
      console.warn('Failed fetching bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.id]);

  const handleCancelBooking = (booking: TicketBooking) => {
    Alert.alert(
      'Cancel Transit Pass',
      `Are you sure you want to cancel PNR ${booking.pnr} (Seat ${booking.seat_number})? Refund will be credited per Uttarakhand Parivahan policy.`,
      [
        { text: 'Keep Pass', style: 'cancel' },
        { 
          text: 'Cancel Pass', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelBooking(booking.id);
              Alert.alert('Pass Cancelled', 'Your seat has been released.');
              fetchBookings();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to cancel pass.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="My Transit Bookings" subtitle="Active Passes & Travel History" />

      {loading ? (
        <LoadingSpinner message="Fetching your tickets..." fullScreen />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="🎫"
              title="No Bookings Yet"
              description="You have no active mountain passes. Discover buses along the Dehradun-Rishikesh corridor."
              actionTitle="Find Buses Now ➔"
              onAction={handleExplore}
            />
          }
          renderItem={({ item }) => (
            <Card 
              style={styles.bookingCard}
              onPress={() => handleSelectBooking(item)}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.pnrText}>PNR: {item.pnr}</Text>
                  <Text style={styles.routeText}>{item.route_name}</Text>
                </View>
                <Badge 
                  label={item.status} 
                  variant={item.status === 'CONFIRMED' ? 'success' : item.status === 'CANCELLED' ? 'error' : 'neutral'} 
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsRow}>
                <View style={styles.col}>
                  <Text style={styles.detailLabel}>SEAT</Text>
                  <Text style={styles.seatNum}>{item.seat_number}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.detailLabel}>BOARDING</Text>
                  <Text style={styles.stationName} numberOfLines={1}>{item.boarding_stop}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.detailLabel}>DESTINATION</Text>
                  <Text style={styles.stationName} numberOfLines={1}>{item.destination_stop}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.fareText}>₹{item.fare_amount}</Text>

                <View style={styles.actionsGroup}>
                  {item.status === 'CONFIRMED' ? (
                    <TouchableOpacity 
                      onPress={() => handleCancelBooking(item)}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity 
                    onPress={() => handleSelectBooking(item)}
                    style={styles.viewPassBtn}
                  >
                    <Text style={styles.viewPassText}>View QR Pass ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pnrText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  routeText: {
    fontSize: typography.fontSize.body,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  col: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  seatNum: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.success,
    marginTop: 2,
  },
  stationName: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  fareText: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: '900',
    color: colors.navy,
    paddingLeft: spacing.xs,
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.errorLight,
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error,
  },
  viewPassBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
  },
  viewPassText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
