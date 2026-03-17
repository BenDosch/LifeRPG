import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { useAuthStore } from '../src/store/authStore';
import { Theme } from '../src/theme';

export default function AuthScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuthStore();

  const handleEmailAuth = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // On native, GoogleSignin must be configured before the first call.
      // The webClientId must match the OAuth 2.0 web client in your Firebase project.
      if (Platform.OS !== 'web') {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: 'REPLACE_WITH_YOUR_WEB_CLIENT_ID',
        });
      }
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>LifeRPG</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' ? 'Sign in to continue your adventure' : 'Create your account'}
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={theme.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !googleLoading}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading && !googleLoading}
            />
          </View>

          {/* Confirm Password (sign-up only) */}
          {mode === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading && !googleLoading}
              />
            </View>
          )}

          {/* Primary button */}
          <TouchableOpacity
            style={[styles.primaryBtn, (loading || googleLoading) && styles.btnDisabled]}
            onPress={handleEmailAuth}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google button */}
          <TouchableOpacity
            style={[styles.googleBtn, (loading || googleLoading) && styles.btnDisabled]}
            onPress={handleGoogle}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={theme.textPrimary} size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color={theme.textPrimary} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Toggle mode */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={loading || googleLoading}
            >
              <Text style={styles.toggleLink}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bgPage,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 36,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: 2,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      padding: 24,
      gap: 16,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(220, 38, 38, 0.3)',
      padding: 10,
    },
    errorText: {
      color: '#dc2626',
      fontSize: 13,
      flex: 1,
    },
    fieldGroup: {
      gap: 6,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: theme.bgDeep,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.textPrimary,
      fontSize: 15,
    },
    primaryBtn: {
      backgroundColor: '#7c3aed',
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    primaryBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.borderDefault,
    },
    dividerText: {
      color: theme.textMuted,
      fontSize: 12,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: theme.bgDeep,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      paddingVertical: 13,
    },
    googleBtnText: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    toggleLabel: {
      color: theme.textMuted,
      fontSize: 13,
    },
    toggleLink: {
      color: '#7c3aed',
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
