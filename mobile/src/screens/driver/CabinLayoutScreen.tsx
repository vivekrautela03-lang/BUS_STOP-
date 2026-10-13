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
import { Badge } from '../../components/Badge';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props {
  navigation: any;
}

interface SeatInspection {
  number: string;
  isOccupied: boolean;
  passenger?: string;
  boardingHalt?: string;
  isSpecialAssist?: boolean;
}

export const CabinLayoutScreen: React.FC<Props> = ({ navigation }) => {
  // Generate 40 seats (10 rows x 4 seats: A, B [Aisle] C, D)
  const [selectedSeat, setSelectedSeat] = useState<SeatInspection | null>(null);

  const seatData: SeatInspection[] = Array.from({ length: 10 }, (_, rowIdx) => {
    const rowNum = rowIdx + 1;
    return ['A', 'B', 'C', 'D'].map((col) => {
      const seatNum = `${rowNum}${col}`;
      // Simulate real mountain occupancy distribution (~32 seats occupied)
      const isOccupied = !['1D', '3B', '5C', '7A', '8D', '10A', '10B', '10C'].includes(seatNum);
      const isSpecialAssist = seatNum === '1A' || seatNum === '1B';
      return {
        number: seatNum,
        isOccupied,
        passenger: isOccupied ? `Traveler ${seatNum}` : undefined,
        boardingHalt: isOccupied ? (rowNum <= 5 ? 'Shimla Central' : 'Solan Bypass') : undefined,
        isSpecialAssist,
      };
    });
  }).flat();

  const handleSeatPress = (seat: SeatInspection) => {
    setSelectedSeat(seat);
  };

  const occupiedCount = seatData.filter((s) => s.isOccupied).length;
  const vacantCount = seatData.length - occupiedCount;

  return (
    <View style={styles.container}>
      <Header
        title="Cabin Occupancy"
        subtitle="40-Seat 2x2 Mountain Starbus Cabin"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Occupancy Summary Bar */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{occupiedCount}</Text>
              <Text style={styles.summaryLabel}>Occupied</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: colors.success }]}>
                {vacantCount}
              </Text>
              <Text style={styles.summaryLabel}>Vacant</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: colors.primary }]}>
                80%
              </Text>
              <Text style={styles.summaryLabel}>Cabin Load</Text>
            </View>
          </View>
        </Card>

        {/* Selected Seat Inspector Banner */}
        {selectedSeat && (
          <Card variant="outlined" style={styles.inspectorCard}>
            <View style={styles.inspectorHeader}>
              <View>
                <Text style={styles.inspectorTitle}>
                  Seat {selectedSeat.number} &#8226; {selectedSeat.isOccupied ? 'Occupied' : 'Vacant'}
                </Text>
                {selectedSeat.isOccupied ? (
                  <Text style={styles.inspectorSub}>
                    {selectedSeat.passenger} (Boarding: {selectedSeat.boardingHalt})
                  </Text>
                ) : (
                  <Text style={styles.inspectorSub}>Available for roadside boarding</Text>
                )}
              </View>
              <Badge
                label={selectedSeat.isOccupied ? 'CHECKED-IN' : 'OPEN'}
                variant={selectedSeat.isOccupied ? 'primary' : 'success'}
              />
            </View>
          </Card>
        )}

        {/* Bus Cabin Visual Layout */}
        <View style={styles.cabinWrapper}>
          <View style={styles.cockpitRow}>
            <View style={styles.driverWheel}>
              <Text style={styles.driverWheelIcon}>☸</Text>
              <Text style={styles.driverWheelText}>CAPTAIN</Text>
            </View>
            <View style={styles.doorBox}>
              <Text style={styles.doorText}>DOOR 🚪</Text>
            </View>
          </View>

          <View style={styles.cabinDivider} />

          {/* Rows 1 through 10 */}
          {Array.from({ length: 10 }, (_, rowIdx) => {
            const rowNum = rowIdx + 1;
            const seatA = seatData.find((s) => s.number === `${rowNum}A`)!;
            const seatB = seatData.find((s) => s.number === `${rowNum}B`)!;
            const seatC = seatData.find((s) => s.number === `${rowNum}C`)!;
            const seatD = seatData.find((s) => s.number === `${rowNum}D`)!;

            return (
              <View key={rowNum} style={styles.seatRow}>
                {/* Left Side: A & B */}
                <View style={styles.seatPair}>
                  <TouchableOpacity
                    style={[
                      styles.seatBox,
                      seatA.isOccupied ? styles.seatOccupied : styles.seatVacant,
                      selectedSeat?.number === seatA.number && styles.seatSelected,
                    ]}
                    onPress={() => handleSeatPress(seatA)}
                  >
                    <Text
                      style={[
                        styles.seatText,
                        seatA.isOccupied ? styles.seatTextOccupied : styles.seatTextVacant,
                      ]}
                    >
                      {seatA.number}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.seatBox,
                      seatB.isOccupied ? styles.seatOccupied : styles.seatVacant,
                      selectedSeat?.number === seatB.number && styles.seatSelected,
                    ]}
                    onPress={() => handleSeatPress(seatB)}
                  >
                    <Text
                      style={[
                        styles.seatText,
                        seatB.isOccupied ? styles.seatTextOccupied : styles.seatTextVacant,
                      ]}
                    >
                      {seatB.number}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Aisle */}
                <View style={styles.aisle}>
                  <Text style={styles.aisleText}>{rowNum}</Text>
                </View>

                {/* Right Side: C & D */}
                <View style={styles.seatPair}>
                  <TouchableOpacity
                    style={[
                      styles.seatBox,
                      seatC.isOccupied ? styles.seatOccupied : styles.seatVacant,
                      selectedSeat?.number === seatC.number && styles.seatSelected,
                    ]}
                    onPress={() => handleSeatPress(seatC)}
                  >
                    <Text
                      style={[
                        styles.seatText,
                        seatC.isOccupied ? styles.seatTextOccupied : styles.seatTextVacant,
                      ]}
                    >
                      {seatC.number}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.seatBox,
                      seatD.isOccupied ? styles.seatOccupied : styles.seatVacant,
                      selectedSeat?.number === seatD.number && styles.seatSelected,
                    ]}
                    onPress={() => handleSeatPress(seatD)}
                  >
                    <Text
                      style={[
                        styles.seatText,
                        seatD.isOccupied ? styles.seatTextOccupied : styles.seatTextVacant,
                      ]}
                    >
                      {seatD.number}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
  summaryCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  inspectorCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorTitle: {
    ...typography.body,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  inspectorSub: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  cabinWrapper: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cockpitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  driverWheel: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  driverWheelIcon: {
    fontSize: 24,
    color: colors.navy,
  },
  driverWheelText: {
    ...typography.overline,
    color: colors.secondaryText,
  },
  doorBox: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doorText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cabinDivider: {
    height: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seatPair: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  aisle: {
    width: 28,
    alignItems: 'center',
  },
  aisleText: {
    ...typography.caption,
    color: colors.secondaryText,
    fontWeight: '700',
  },
  seatBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  seatOccupied: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  seatVacant: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  seatSelected: {
    borderColor: colors.accentGold,
    borderWidth: 3,
  },
  seatText: {
    fontSize: 12,
    fontWeight: '800',
  },
  seatTextOccupied: {
    color: '#FFF',
  },
  seatTextVacant: {
    color: colors.success,
  },
});
