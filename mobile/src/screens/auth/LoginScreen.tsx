// ============================================================================
// BUS STOP — LOGIN SCREEN (SUPABASE INTEGRATION)
// Safe credential handling, role determination, and quick role switch
// ============================================================================

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
  onSuccess?: () => void;
  navigation?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onNavigateToRegister, 
  onSuccess,
  navigation,
}) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('passenger');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }
    setErrorMessage('');
    try {
      await login(email.trim(), password, selectedRole);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandIcon}>🚏</Text>
            <Text style={styles.brandText}>BUS STOP</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your mountain transit account</Text>
        </View>

        {/* Role Segmented Selector */}
        <View style={styles.roleTabsContainer}>
          <TouchableOpacity 
            style={[styles.roleTab, selectedRole === 'passenger' && styles.roleTabActive]}
            onPress={() => handleRoleSelect('passenger')}
          >
            <Text style={[styles.roleTabText, selectedRole === 'passenger' && styles.roleTabTextActive]}>
              👥 Passenger
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleTab, selectedRole === 'driver' && styles.roleTabActive]}
            onPress={() => handleRoleSelect('driver')}
          >
            <Text style={[styles.roleTabText, selectedRole === 'driver' && styles.roleTabTextActive]}>
              👨‍✈️ Driver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleTab, selectedRole === 'admin' && styles.roleTabActive]}
            onPress={() => handleRoleSelect('admin')}
          >
            <Text style={[styles.roleTabText, selectedRole === 'admin' && styles.roleTabTextActive]}>
              ⚙️ Admin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Alert Box */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Inputs */}
        <View style={styles.formCard}>
          <Input 
            label="Email Address" 
            placeholder="e.g. name@example.com" 
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input 
            label="Password" 
            placeholder="••••••••" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.forgotBtn} 
            onPress={() => Alert.alert('Password Recovery', 'A password reset link will be sent to ' + email)}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button 
            title={isLoading ? 'Signing In...' : `Sign In as ${selectedRole === 'driver' ? 'Driver Captain' : selectedRole === 'admin' ? 'Fleet Admin' : 'Passenger'} ➔`}
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* Switch to Register */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account yet? </Text>
          <TouchableOpacity onPress={() => onNavigateToRegister ? onNavigateToRegister() : navigation?.navigate('Register')}>
            <Text style={styles.signUpLink}>Create Account</Text>
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
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: typography.fontSize.bodySm,
    color: colors.primary,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: spacing.xs,
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
  signUpLink: {
    fontSize: typography.fontSize.bodySm,
    color: colors.primary,
    fontWeight: '800',
  },
});
