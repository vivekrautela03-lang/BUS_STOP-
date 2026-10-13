import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props {
  navigation: any;
}

export const IncidentReportScreen: React.FC<Props> = ({ navigation }) => {
  const [category, setCategory] = useState<string>('LANDSLIDE');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'CRITICAL'>('CRITICAL');
  const [locationName, setLocationName] = useState<string>('NH-3 Mile marker 42 near Kandaghat');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const categories = [
    { id: 'LANDSLIDE', label: '⛰️ Landslide / Boulder Fall' },
    { id: 'TRAFFIC', label: '🚗 Heavy Gridlock / Jam' },
    { id: 'BREAKDOWN', label: '🔧 Mechanical / Flat Tyre' },
    { id: 'WEATHER', label: '🌫️ Dense Hill Fog / Snow' },
    { id: 'MEDICAL', label: '🚑 Medical Emergency' },
  ];

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a brief description of the incident for transit control.');
      return;
    }

    setSubmitting(true);
    try {
      await api.reportIncident({
        category,
        severity,
        location: locationName,
        description,
        timestamp: new Date().toISOString(),
      });

      Alert.alert(
        'Advisory Broadcasted',
        `Incident reported to Shimla-Manali Transit Control Room. Traffic warning and reroute alerts dispatched to nearby fleet captains.`,
        [
          {
            text: 'Return to Dashboard',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to broadcast incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Report Incident"
        subtitle="Emergency Highway Advisory Broadcast"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Warning Banner */}
        <Card variant="outlined" style={styles.warningBanner}>
          <Text style={styles.warningTitle}>⚠️ Urgent Roadway Alert System</Text>
          <Text style={styles.warningSub}>
            Transmitted directly to Himachal Pradesh State Transit Control and surrounding BUS STOP vehicles.
          </Text>
        </Card>

        {/* Category Selector */}
        <Text style={styles.sectionTitle}>Incident Type</Text>
        <View style={styles.categoryGrid}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.categoryCard,
                category === c.id && styles.categoryCardActive,
              ]}
              onPress={() => setCategory(c.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === c.id && styles.categoryTextActive,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Severity Selector */}
        <Text style={styles.sectionTitle}>Severity Level</Text>
        <View style={styles.severityRow}>
          {(['LOW', 'MEDIUM', 'CRITICAL'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.severityBtn,
                severity === s && (s === 'CRITICAL' ? styles.sevCrit : s === 'MEDIUM' ? styles.sevMed : styles.sevLow),
              ]}
              onPress={() => setSeverity(s)}
            >
              <Text
                style={[
                  styles.severityText,
                  severity === s && styles.severityTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location Input */}
        <Text style={styles.sectionTitle}>Current Highway Location</Text>
        <TextInput
          style={styles.textInput}
          value={locationName}
          onChangeText={setLocationName}
          placeholder="e.g. NH-3 Mile marker 42"
          placeholderTextColor={colors.placeholder}
        />

        {/* Description Input */}
        <Text style={styles.sectionTitle}>Incident Description & Observations</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe road blockage, estimated clearance delay, or emergency assistance needed..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={4}
        />

        <View style={styles.submitContainer}>
          <Button
            title="Broadcast Incident to Control Room"
            variant="danger"
            size="large"
            loading={submitting}
            onPress={handleSubmit}
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
  warningBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    marginBottom: spacing.lg,
  },
  warningTitle: {
    ...typography.body,
    fontWeight: '800',
    color: colors.error,
  },
  warningSub: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.secondaryText,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  categoryGrid: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryCardActive: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  categoryText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryTextActive: {
    color: colors.error,
    fontWeight: '800',
  },
  severityRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sevLow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  sevMed: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  sevCrit: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  severityText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  severityTextActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitContainer: {
    marginTop: spacing.md,
  },
});
