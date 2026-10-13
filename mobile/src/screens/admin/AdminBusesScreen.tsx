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
import { FleetBus } from '../../types';

interface Props {
  navigation: any;
}

export const AdminBusesScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [buses, setBuses] = useState<FleetBus[]>([]);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const fetched = await api.getBuses();
        setBuses(fetched);
      } catch (err) {
        console.error('Error fetching buses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  const filtered = buses.filter((b) => {
    const reg = (b.registrationNumber || b.registration_number || b.bus_number || '').toLowerCase();
    const model = (b.model || b.type || '').toLowerCase();
    const q = search.toLowerCase();
    return reg.includes(q) || model.includes(q);
  });

  return (
    <View style={styles.container}>
      <Header
        title="Fleet Vehicles"
        subtitle="40-Seater Mountain Starbus Fleet Registry"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search Registration No. or Bus Model..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <LoadingSpinner message="Querying fleet registry..." />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollList}>
            {filtered.map((bus) => (
              <Card key={bus.id} variant="elevated" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.regNo}>{bus.registrationNumber}</Text>
                    <Text style={styles.busModel}>{bus.model}</Text>
                  </View>
                  <Badge
                    label={bus.status}
                    variant={bus.status === 'ACTIVE' ? 'success' : 'warning'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.specsRow}>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>SEATING CAPACITY</Text>
                    <Text style={styles.specValue}>{bus.capacity} Seats (2x2)</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>MOUNTAIN PERMIT</Text>
                    <Text style={[styles.specValue, { color: colors.success }]}>VALID</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>SPEED GOVERNOR</Text>
                    <Text style={styles.specValue}>60 km/h</Text>
                  </View>
                </View>

                <View style={styles.amenitiesRow}>
                  {bus.amenities?.map((amenity, i) => (
                    <View key={i} style={styles.amenityBadge}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
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
  regNo: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  busModel: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  specItem: {
    flex: 1,
  },
  specLabel: {
    ...typography.overline,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  specValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  amenityBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  amenityText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
