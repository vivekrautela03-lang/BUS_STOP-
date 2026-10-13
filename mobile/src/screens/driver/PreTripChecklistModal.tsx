import React, { useState } from 'react';
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
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props {
  navigation: any;
}

interface ChecklistItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  checked: boolean;
}

export const PreTripChecklistModal: React.FC<Props> = ({ navigation }) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      title: 'Air Brakes & Dual Pneumatic Pressure',
      subtitle: 'Main reservoir pressure >= 8.5 bar, no audible leaks',
      category: 'BRAKES',
      checked: true,
    },
    {
      id: '2',
      title: 'Mountain All-Weather Tyres & Tread Depth',
      subtitle: 'Min 4mm tread depth on all 6 wheels, lug nuts torqued',
      category: 'TYRES',
      checked: true,
    },
    {
      id: '3',
      title: 'High-Beam Projectors & Amber Fog Lamps',
      subtitle: 'Blinkers, hazard flashers, and cabin night indicators functional',
      category: 'ELECTRICAL',
      checked: false,
    },
    {
      id: '4',
      title: 'Mountain First Aid & Dual Fire Extinguishers',
      subtitle: 'Pressurized ABC powder cylinders (Exp: Dec 2026)',
      category: 'SAFETY',
      checked: true,
    },
    {
      id: '5',
      title: 'GPS Tracking Telemetry & Emergency SOS Button',
      subtitle: 'Live ping connected to transit dispatch tower',
      category: 'RADAR',
      checked: false,
    },
    {
      id: '6',
      title: 'Engine Coolant, Antifreeze & Fuel Reserve',
      subtitle: 'Coolant level normal, diesel tank >= 75% for hill climb',
      category: 'FLUIDS',
      checked: true,
    },
  ]);

  const [saving, setSaving] = useState<boolean>(false);

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allPassed = items.every((i) => i.checked);
  const checkedCount = items.filter((i) => i.checked).length;

  const handleSignOff = () => {
    if (!allPassed) {
      Alert.alert(
        'Checklist Incomplete',
        `You have verified ${checkedCount} of 6 safety points. Mountain regulations mandate 100% sign-off before departure.`
      );
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        'Inspection Signed Off',
        'Pre-trip vehicle safety inspection logged with timestamp and captain ID.',
        [
          {
            text: 'Proceed to Active Trip',
            onPress: () => navigation.navigate('DriverActiveTrip'),
          },
        ]
      );
    }, 600);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Pre-Trip Inspection"
        subtitle="Mandatory Mountain Transit Safety Sign-off"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Card
          variant="elevated"
          style={[
            styles.bannerCard,
            { backgroundColor: allPassed ? '#ECFDF5' : colors.primarySoft },
          ]}
        >
          <View style={styles.bannerRow}>
            <View>
              <Text
                style={[
                  styles.bannerTitle,
                  { color: allPassed ? colors.success : colors.primary },
                ]}
              >
                {allPassed ? 'ALL SYSTEMS CLEARED' : 'SAFETY PROTOCOL IN PROGRESS'}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {checkedCount} / {items.length} points verified by Captain
              </Text>
            </View>
            <Badge
              label={allPassed ? 'READY' : 'PENDING'}
              variant={allPassed ? 'success' : 'warning'}
            />
          </View>
        </Card>

        <Text style={styles.sectionHeader}>6-Point Inspection Checklist</Text>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => toggleCheck(item.id)}
            style={[
              styles.checkItem,
              item.checked ? styles.checkItemActive : styles.checkItemInactive,
            ]}
          >
            <View
              style={[
                styles.checkbox,
                item.checked ? styles.checkboxActive : styles.checkboxInactive,
              ]}
            >
              {item.checked && <Text style={styles.checkTick}>✓</Text>}
            </View>

            <View style={styles.itemMeta}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Badge label={item.category} variant="secondary" />
              </View>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.actionContainer}>
          <Button
            title={allPassed ? 'Sign Off & Authorize Departure' : 'Complete All Points First'}
            variant={allPassed ? 'success' : 'secondary'}
            size="large"
            disabled={!allPassed}
            loading={saving}
            onPress={handleSignOff}
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  bannerCard: {
    marginBottom: spacing.lg,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    ...typography.h3,
    fontWeight: '800',
  },
  bannerSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  sectionHeader: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  checkItemActive: {
    borderColor: colors.success,
  },
  checkItemInactive: {
    borderColor: colors.border,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.success,
  },
  checkboxInactive: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  checkTick: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  itemMeta: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
  },
  actionContainer: {
    marginTop: spacing.lg,
  },
});
