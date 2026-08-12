import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext'
import { colors } from '../theme/colors'
import '../i18n'

function RootNavigator() {
  const { user, loading: authLoading } = useAuth()
  const { onboarded, loading: onboardingLoading } = useOnboarding()

  if (authLoading || onboardingLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream50 }}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !!user}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </CartProvider>
        </AuthProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  )
}
