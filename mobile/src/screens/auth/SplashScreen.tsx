// ============================================================================
// BUS STOP — PREMIUM SPLASH SCREEN (MOBILE LAUNCHER)
// Modern brand mark, wordmark, tagline "Every journey starts somewhere."
// Smooth entrance animation & instant session hydration without artificial delay.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Image 
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: (target: 'onboarding' | 'main' | 'auth') => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { user, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Smooth, lightweight entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    async function checkNavigation() {
      const onboardingDone = await storageService.isOnboardingDone();
      
      // Smooth fade transition after initialization
      setTimeout(() => {
        if (user) {
          onFinish('main');
        } else if (!onboardingDone) {
          onFinish('onboarding');
        } else {
          onFinish('auth');
        }
      }, 700);
    }

    checkNavigation();
  }, [isLoading, user]);

  return (
    <View style={styles.container}>
      {/* Background Decorative Rings */}
      <View style={styles.outerRing} />
      <View style={styles.innerRing} />

      {/* Hero Animated Container */}
      <Animated.View 
        style={[
          styles.heroCard, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }] 
          }
        ]}
      >
        {/* Brand Icon Image */}
        <View style={styles.iconCircle}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>

        {/* Wordmark */}
        <Text style={styles.brandTitle}>
          BUS <Text style={styles.brandHighlight}>STOP</Text>
        </Text>

        {/* Transit Tag */}
        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>MOUNTAIN TRANSIT NETWORK</Text>
        </View>

        {/* Tagline required by user specification */}
        <Text style={styles.tagline}>
          Every journey starts somewhere.
        </Text>
      </Animated.View>

      {/* Bottom Version */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Uttarakhand State Road Transport Corporation</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  outerRing: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: (width * 1.4) / 2,
    borderWidth: 1.5,
    borderColor: '#E1F0FD',
  },
  innerRing: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: (width * 0.95) / 2,
    backgroundColor: '#F0F8FF',
  },
  heroCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  iconImage: {
    width: 120,
    height: 120,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.navy,
    letterSpacing: 2,
  },
  brandHighlight: {
    color: colors.primary,
  },
  networkBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  networkBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: typography.fontSize.body,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
