import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSignIn, useSignUp } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type Mode = 'signIn' | 'signUp';

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleSignIn = async () => {
    if (!signInLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.dismiss();
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? e.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded) return;
    setLoading(true);
    setError('');
    try {
      await signUp.create({ emailAddress: email, password, username });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? e.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUpLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.dismiss();
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? e.message ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Close */}
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoBlock}>
          <Text style={[styles.logo, { color: colors.primary }]}>FANVERSE</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {pendingVerification ? 'Check your email' : mode === 'signIn' ? 'Welcome back' : 'Create account'}
          </Text>
        </View>

        {pendingVerification ? (
          <View style={styles.form}>
            <Text style={[styles.verifyText, { color: colors.foreground }]}>
              We sent a verification code to {email}
            </Text>
            <Field
              label="Verification Code"
              value={code}
              onChangeText={setCode}
              placeholder="Enter code"
              keyboardType="number-pad"
              colors={colors}
            />
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            <SubmitBtn label={loading ? 'Verifying...' : 'Verify Email'} onPress={handleVerify} disabled={loading} colors={colors} />
          </View>
        ) : (
          <View style={styles.form}>
            {mode === 'signUp' && (
              <Field label="Username" value={username} onChangeText={setUsername} placeholder="coolFan99" colors={colors} />
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="fan@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              colors={colors}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              colors={colors}
            />

            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

            <SubmitBtn
              label={loading ? (mode === 'signIn' ? 'Signing in...' : 'Creating account...') : (mode === 'signIn' ? 'Sign In' : 'Create Account')}
              onPress={mode === 'signIn' ? handleSignIn : handleSignUp}
              disabled={loading}
              colors={colors}
            />

            <TouchableOpacity
              onPress={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setError(''); }}
              style={styles.switchBtn}
            >
              <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
                {mode === 'signIn' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {mode === 'signIn' ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, colors,
}: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder: string;
  secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any; colors: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
      />
    </View>
  );
}

function SubmitBtn({ label, onPress, disabled, colors }: { label: string; onPress: () => void; disabled: boolean; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.submitBtn, { backgroundColor: disabled ? colors.muted : colors.primary }]}
    >
      <Text style={[styles.submitText, { color: disabled ? colors.mutedForeground : colors.primaryForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 32 },
  closeBtn: { alignSelf: 'flex-end' as const },
  logoBlock: { alignItems: 'center', gap: 8 },
  logo: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 3 },
  subtitle: { fontSize: 16 },
  form: { gap: 16 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3 },
  fieldInput: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16,
  },
  error: { fontSize: 13, textAlign: 'center' },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700' as const },
  switchBtn: { alignItems: 'center', paddingVertical: 4 },
  switchText: { fontSize: 14 },
  verifyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
