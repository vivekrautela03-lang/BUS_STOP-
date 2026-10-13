// ============================================================================
// BUS STOP — REGISTER / SIGN UP SCREEN
// Creates authenticated user account with Passenger or Driver role
// ============================================================================

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onSuccess?: () => void;
  navigation?: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  onNavigateToLogin, 
  onSuccess,
  navigation,
}) => {
  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [role, setRole] = useState<UserRole>('passenger');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (role === 'driver' && !licenseNumber.trim()) {
      setErrorMessage('Commercial Driving License (DL) is required for Driver Captains');
      return;
    }

    setErrorMessage('');
    try {
      await register(email, password, fullName, role);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Join BUS STOP</Text>
          <Text style={styles.subtitle}>Create your mountain transit traveler or captain profile</Text>
        </View>

        {/* Role Selection Segment */}
        <View style={styles.roleTabsContainer}>
          <TouchableOpacity 
            style={[styles.roleTab, role === 'passenger' && styles.roleTabActive]}
            onPress={() => setRole('passenger')}
          >
            <Text style={[styles.roleTabText, role === 'passenger' && styles.roleTabTextActive]}>
              👥 Passenger Traveler
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleTab, role === 'driver' && styles.roleTabActive]}
            onPress={() => setRole('driver')}
          >
            <Text style={[styles.roleTabText, role === 'driver' && styles.roleTabTextActive]}>
              👨‍✈️ Fleet Captain
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Alert Box */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        <View style={styles.formCard}>
          <Input 
            label="Full Name" 
            placeholder="e.g. Vivek Rautela" 
            value={fullName}
            onChangeText={setFullName}
          />

          <Input 
            label="Email Address" 
            placeholder="e.g. traveler@busstop.transit" 
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input 
            label="Phone Number" 
            placeholder="+91 98765 43210" 
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {role === 'driver' ? (
            <Input 
              label="Commercial License (DL Number)" 
              placeholder="e.g. DL-042023001894" 
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
              helper="Verified against Uttarakhand Transport Authority"
            />
          ) : null}

          <Input 
            label="Password" 
            placeholder="Create secure password (min 6 chars)" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button 
            title={isLoading ? 'Creating Account...' : `Register as ${role === 'driver' ? 'Fleet Captain' : 'Passenger'} ➔`}
            onPress={handleRegister}
            loading={isLoading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* Switch to Login */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => onNavigateToLogin ? onNavigateToLogin() : navigation?.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.titleLg,
    fontWeight: '900',
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  roleTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleTabTextActive: {
    color: colors.primary,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.bodySm,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: typography.fontSize.bodySm,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: typography.fontSize.bodySm,
    color: colors.primary,
    fontWeight: '800',
  },
});
