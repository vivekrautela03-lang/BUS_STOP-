// ============================================================================
// BUS STOP — ONBOARDING CAROUSEL SCREEN
// Modern, friendly introduction to Passenger, Driver, and Transit benefits
// ============================================================================

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  SafeAreaView, 
  TouchableOpacity 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button } from '../../components/Button';
import { storageService } from '../../services/storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '🏔️',
    title: 'Scenic Mountain Corridors',
    subtitle: 'Connecting Dehradun, Rishikesh, Haridwar & Roorkee with real-time transit schedules and live mountain GPS.',
  },
  {
    icon: '💺',
    title: 'Select Seats & Instant Passes',
    subtitle: 'Pick your seat on Tata Starbus 40-seaters with verified digital QR tickets, avoiding bus stop queues.',
  },
  {
    icon: '👨‍✈️',
    title: 'Captain & Fleet Cockpit',
    subtitle: 'Certified drivers manage manifests, pre-trip safety checks, and stop progression with one-tap dispatch.',
  },
];

interface OnboardingScreenProps {
  onComplete?: () => void;
  navigation?: any;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, navigation }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleNext = async () => {
    if (currentIdx < SLIDES.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      await storageService.setOnboardingDone();
      if (onComplete) onComplete();
      else navigation?.navigate('Login');
    }
  };

  const handleSkip = async () => {
    await storageService.setOnboardingDone();
    if (onComplete) onComplete();
    else navigation?.navigate('Login');
  };

  const slide = SLIDES[currentIdx];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>BUS STOP</Text>
        </View>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.slideIcon}>{slide.icon}</Text>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                i === currentIdx ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Button 
          title={currentIdx === SLIDES.length - 1 ? 'Start Journey ➔' : 'Continue ➔'} 
          onPress={handleNext}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  skipText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  slideIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: typography.fontSize.titleLg,
    fontWeight: '900',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 28,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.border,
  },
  bottomBar: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
