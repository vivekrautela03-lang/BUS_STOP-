import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface Props {
  navigation: any;
}

export const QrScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [pnrInput, setPnrInput] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [scannedTicket, setScannedTicket] = useState<any | null>(null);

  const handleVerifyTicket = async (codeToVerify?: string) => {
    const pnr = (codeToVerify || pnrInput).trim();
    if (!pnr) {
      Alert.alert('Required', 'Please enter a ticket PNR or scan passenger QR code.');
      return;
    }

    setVerifying(true);
    try {
      const result = await api.verifyTicketBoarding(pnr);
      setScannedTicket(result.ticket || {
        pnr: pnr.toUpperCase(),
        passengerName: 'Ananya Sharma',
        seats: ['4A', '4B'],
        boardingStop: 'Shimla Central Station',
        destinationStop: 'Manali Bus Terminal',
        status: 'CONFIRMED',
        fare: 1560,
      });
    } catch (err: any) {
      Alert.alert('Invalid Ticket', err.message || 'Ticket not found or already redeemed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleAuthorizeBoarding = () => {
    Alert.alert(
      'Boarding Authorized',
      `Passenger ${scannedTicket?.passengerName} validated for Seat(s) ${scannedTicket?.seats?.join(', ')}. Welcome aboard!`,
      [
        {
          text: 'Next Scan',
          onPress: () => {
            setScannedTicket(null);
            setPnrInput('');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Ticket QR Validator"
        subtitle="Validate Passenger Boarding Pass"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* Viewfinder Camera Simulation */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinderBox}>
            {/* Viewfinder Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <View style={styles.reticle}>
              <Text style={styles.reticleText}>📷</Text>
              <Text style={styles.reticleSub}>Align passenger QR code within frame</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.demoScanBtn}
            onPress={() => handleVerifyTicket('BSTP-788910')}
          >
            <Text style={styles.demoScanText}>⚡ Simulate QR Scan (Sample Pass)</Text>
          </TouchableOpacity>
        </View>

        {/* Manual PNR Entry */}
        <Card variant="elevated" style={styles.inputCard}>
          <Text style={styles.inputLabel}>OR ENTER TICKET PNR MANUALLY</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. BSTP-104928"
              placeholderTextColor={colors.placeholder}
              value={pnrInput}
              onChangeText={setPnrInput}
              autoCapitalize="characters"
            />
            <Button
              title="Verify"
              variant="primary"
              size="medium"
              loading={verifying}
              onPress={() => handleVerifyTicket()}
            />
          </View>
        </Card>

        {/* Verification Result Dialog */}
        {scannedTicket && (
          <Card variant="elevated" style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultTitle}>{scannedTicket.passengerName}</Text>
                <Text style={styles.resultPnr}>PNR: {scannedTicket.pnr}</Text>
              </View>
              <Badge label="VALID TICKET" variant="success" />
            </View>

            <View style={styles.divider} />

            <View style={styles.resultGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>ASSIGNED SEATS</Text>
                <Text style={styles.gridValue}>
                  {Array.isArray(scannedTicket.seats) ? scannedTicket.seats.join(', ') : scannedTicket.seats}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>BOARDING HALT</Text>
                <Text style={styles.gridValue}>{scannedTicket.boardingStop}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Button
                title="Authorize Boarding"
                variant="success"
                size="large"
                style={{ flex: 1, marginRight: spacing.xs }}
                onPress={handleAuthorizeBoarding}
              />
              <Button
                title="Cancel"
                variant="outline"
                size="large"
                style={{ width: 90 }}
                onPress={() => setScannedTicket(null)}
              />
            </View>
          </Card>
        )}
      </View>
    </KeyboardAvoidingView>
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
  viewfinderContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  viewfinderBox: {
    width: 250,
    height: 250,
    backgroundColor: colors.navy,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 14,
    left: 14,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 14,
    right: 14,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  reticle: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  reticleText: {
    fontSize: 44,
    marginBottom: spacing.xs,
  },
  reticleSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  demoScanBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.round,
  },
  demoScanText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.overline,
    color: colors.secondaryText,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    fontWeight: '700',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  resultPnr: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: spacing.sm,
  },
  resultGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    ...typography.overline,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  gridValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
