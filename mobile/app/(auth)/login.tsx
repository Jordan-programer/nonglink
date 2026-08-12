import { Link } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { ApiError } from '../../lib/api'
import { colors } from '../../theme/colors'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const insets = useSafeAreaInsets()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      await login(identifier, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('login.identifier')}</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={t('login.identifierPlaceholder')}
              placeholderTextColor="rgba(15,36,17,0.4)"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('login.password')}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('login.passwordPlaceholder')}
              placeholderTextColor="rgba(15,36,17,0.4)"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.submit, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>{submitting ? t('login.submitting') : t('login.submit')}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('login.noAccount')}</Text>
            <Link href="/register" replace>
              <Text style={styles.footerLink}>{t('login.createAccount')}</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.leaf50,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 28,
    borderWidth: 1,
    borderColor: colors.leaf100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.leaf950,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  field: {
    marginTop: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.8)',
  },
  input: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.leaf950,
  },
  errorBox: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: colors.earth50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.earth800,
  },
  submit: {
    marginTop: 24,
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  footerRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(15,36,17,0.6)',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf700,
  },
})
