import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors } from '../../../theme/colors'

export default function MercadoLayout() {
  const { t } = useTranslation()

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream50 },
        headerTintColor: colors.leaf950,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
      <Stack.Screen name="carrinho" options={{ title: t('cart.title') }} />
    </Stack>
  )
}
