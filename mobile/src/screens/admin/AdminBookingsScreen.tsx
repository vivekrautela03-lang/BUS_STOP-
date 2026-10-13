import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { api } from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { TicketBooking } from '../../types';

interface Props {
  navigation: any;
}

export const AdminBookingsScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [bookings, setBookings] = useState<TicketBooking[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const fetched = await api.getBookings();
        setBookings(fetched);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    const pnr = (b.ticketNumber || b.pnr || '').toLowerCase();
    const name = (b.passengerName || b.passenger_name || '').toLowerCase();
    const seats = ((b.seats || [b.seat_number || '']).join(',')).toLowerCase();
    const q = search.toLowerCase();
    return pnr.includes(q) || name.includes(q) || seats.includes(q);
  });

  return (
    <View style={styles.container}>
      <Header
        title="Transaction Audit"
        subtitle="Real-Time Passenger Bookings & PNR Ledger"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search by PNR, Passenger, or Seat No..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <LoadingSpinner message="Auditing ledger transactions..." />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollList}>
            {filtered.map((booking) => (
              <Card key={booking.id} variant="elevated" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.passengerName}>{booking.passengerName}</Text>
                    <Text style={styles.pnrCode}>PNR: {booking.ticketNumber}</Text>
                  </View>
                  <Badge
                    label={booking.status}
                    variant={booking.status === 'CONFIRMED' ? 'success' : 'error'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsRow}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>SEATS</Text>
                    <Text style={styles.seatBadge}>{(booking.seats || [booking.seat_number || '1A']).join(', ')}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>TOTAL FARE</Text>
                    <Text style={styles.fareAmount}>₹{booking.totalFare || booking.fare_amount || 0}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>PAYMENT</Text>
                    <Text style={styles.paymentMethod}>{booking.paymentMethod || 'UPI'}</Text>
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.footerDate}>
                    Booked: {new Date(booking.createdAt || booking.created_at || Date.now()).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.phoneText}>{booking.passengerPhone || booking.passenger_phone || 'Contact: +91 98160 00000'}</Text>
                </View>
              </Card>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  searchBar: {
    height: 46,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...typography.body,
    marginBottom: spacing.md,
  },
  scrollList: {
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  passengerName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  pnrCode: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...typography.overline,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  seatBadge: {
    ...typography.body,
    fontWeight: '800',
    color: colors.primary,
  },
  fareAmount: {
    ...typography.body,
    fontWeight: '800',
    color: colors.success,
  },
  paymentMethod: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerDate: {
    ...typography.caption,
    color: colors.secondaryText,
  },
  phoneText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});
