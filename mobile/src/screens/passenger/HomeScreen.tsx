// ============================================================================
// BUS STOP — PASSENGER HOME SCREEN
// Mountain corridor transit discovery, pickup & destination search, live buses
// ============================================================================

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { api } from '../../services/api';
import { TransitRoute, FleetBus } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HomeScreenProps {
  navigation?: any;
  onSelectRoute?: (route: TransitRoute) => void;
  onSelectBus?: (bus: FleetBus) => void;
  onOpenMap?: () => void;
  onOpenMyBookings?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
  onSelectRoute,
  onSelectBus,
  onOpenMap,
  onOpenMyBookings,
}) => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [buses, setBuses] = useState<FleetBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleSelectBus = (bus: FleetBus) => {
    if (onSelectBus) onSelectBus(bus);
    else navigation?.navigate('BusDetails', { bus });
  };

  const handleSelectRoute = (route: TransitRoute) => {
    if (onSelectRoute) onSelectRoute(route);
    else navigation?.navigate('BusDetails', { route });
  };

  const handleOpenMap = () => {
    if (onOpenMap) onOpenMap();
    else navigation?.navigate('MapTab');
  };

  const handleOpenMyBookings = () => {
    if (onOpenMyBookings) onOpenMyBookings();
    else navigation?.navigate('BookingsTab');
  };

  const loadData = async () => {
    try {
      const [routesData, busesData] = await Promise.all([
        api.getRoutes(),
        api.getBuses(),
      ]);
      setRoutes(routesData);
      setBuses(busesData);
    } catch (err) {
      console.warn('Failed loading home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const activeBuses = buses.filter(b => b.status === 'IN_TRANSIT' || b.status === 'SCHEDULED');

  return (
    <View style={styles.container}>
      <Header 
        roleBadge="PASSENGER"
        rightAction={
          <TouchableOpacity onPress={onOpenMyBookings} style={styles.ticketPill}>
            <Text style={styles.ticketPillText}>🎫 My Passes</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Mountain Corridor Hero Card */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroGreeting}>
                Namaste, {user?.full_name?.split(' ')[0] || 'Traveler'} 👋
              </Text>
              <Text style={styles.heroSubtitle}>Uttarakhand Mountain Transit Authority</Text>
            </View>
            <View style={styles.weatherPill}>
              <Text style={styles.weatherText}>☀️ 24°C Sunny</Text>
            </View>
          </View>

          {/* Search Box Trigger */}
          <TouchableOpacity 
            style={styles.searchBox}
            activeOpacity={0.9}
            onPress={() => routes.length > 0 && handleSelectRoute(routes[0])}
          >
            <View style={styles.searchRow}>
              <Text style={styles.searchDotBlue}>📍</Text>
              <Text style={styles.searchPlaceholder}>Dehradun (ISBT) ➔ Destination</Text>
            </View>
            <View style={styles.searchBtn}>
              <Text style={styles.searchBtnText}>Find Buses</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Corridor Filter Pills */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>High-Frequency Corridors</Text>
          <TouchableOpacity onPress={handleOpenMap}>
            <Text style={styles.viewMapLink}>Live Map ➔</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.corridorScroll}>
          {routes.map(r => (
            <TouchableOpacity 
              key={r.id} 
              style={styles.corridorCard}
              onPress={() => handleSelectRoute(r)}
              activeOpacity={0.8}
            >
              <View style={styles.corridorTop}>
                <View style={styles.routeNumBadge}>
                  <Text style={styles.routeNumText}>R-{r.route_number}</Text>
                </View>
                <Text style={styles.corridorFare}>₹{r.base_fare}</Text>
              </View>
              <Text style={styles.corridorName} numberOfLines={1}>{r.name}</Text>
              <Text style={styles.corridorMeta}>
                {r.distance_km} km • ~{r.estimated_minutes} mins
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Live Active Buses Feed */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Buses on Mountain Route</Text>
          <Badge label="GPS TRACKED" variant="live" />
        </View>

        {loading ? (
          <LoadingSpinner message="Fetching live fleet GPS..." />
        ) : activeBuses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🚍</Text>
            <Text style={styles.emptyTitle}>All scheduled buses in depot</Text>
            <Text style={styles.emptyText}>Next departures commence from Dehradun ISBT at 06:00 AM.</Text>
          </Card>
        ) : (
          activeBuses.map(bus => (
            <Card 
              key={bus.id} 
              style={styles.busCard}
              onPress={() => handleSelectBus(bus)}
            >
              <View style={styles.busCardTop}>
                <View style={styles.busBadgeRow}>
                  <Text style={styles.busIcon}>🚍</Text>
                  <View>
                    <Text style={styles.busNumber}>{bus.bus_number}</Text>
                    <Text style={styles.busModel}>Tata Starbus Ultra 40S</Text>
                  </View>
                </View>
                <Badge 
                  label={bus.status === 'IN_TRANSIT' ? 'LIVE ON ROUTE' : 'BOARDING'} 
                  variant={bus.status === 'IN_TRANSIT' ? 'success' : 'primary'} 
                />
              </View>

              <View style={styles.routeDivider} />

              <View style={styles.busRouteRow}>
                <View style={styles.routeStopCol}>
                  <Text style={styles.stopLabel}>CURRENT HALT</Text>
                  <Text style={styles.stopName}>{bus.current_stop || 'Prem Nagar'}</Text>
                </View>
                <Text style={styles.routeArrow}>➔</Text>
                <View style={styles.routeStopColRight}>
                  <Text style={styles.stopLabel}>NEXT STATION</Text>
                  <Text style={styles.stopName}>{bus.next_stop || 'Doiwala Junction'}</Text>
                </View>
              </View>

              <View style={styles.busCardFooter}>
                <View style={styles.seatsPill}>
                  <Text style={styles.seatsText}>
                    💺 <Text style={styles.seatsNum}>{bus.available_seats}</Text> / {bus.capacity} seats left
                  </Text>
                </View>

                <View style={styles.fareActionRow}>
                  <Text style={styles.fareTag}>₹{bus.fare}</Text>
                  <View style={styles.bookPill}>
                    <Text style={styles.bookPillText}>Select Seat ➔</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
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
  ticketPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  heroBanner: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  heroGreeting: {
    fontSize: typography.fontSize.titleLg,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.sky,
    marginTop: 2,
    fontWeight: '600',
  },
  weatherPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weatherText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchDotBlue: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '800',
    color: colors.navy,
  },
  viewMapLink: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '700',
    color: colors.primary,
  },
  corridorScroll: {
    marginBottom: spacing.xl,
  },
  corridorCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  corridorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routeNumBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  routeNumText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  corridorFare: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: '900',
    color: colors.navy,
  },
  corridorName: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  corridorMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  busCard: {
    marginBottom: spacing.md,
  },
  busCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  busIcon: {
    fontSize: 28,
  },
  busNumber: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: '800',
    color: colors.navy,
  },
  busModel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  routeDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  busRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  routeStopCol: {
    flex: 1,
  },
  routeStopColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stopLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  stopName: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 2,
  },
  routeArrow: {
    fontSize: 16,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
  },
  busCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  seatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  seatsNum: {
    color: colors.success,
    fontWeight: '800',
  },
  fareActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fareTag: {
    fontSize: typography.fontSize.bodyLg,
    fontWeight: '900',
    color: colors.navy,
  },
  bookPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  bookPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '800',
    color: colors.navy,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
