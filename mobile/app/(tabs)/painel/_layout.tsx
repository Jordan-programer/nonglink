import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors } from '../../../theme/colors'

export default function PainelLayout() {
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
      <Stack.Screen name="index" options={{ title: t('painel.title') }} />
      <Stack.Screen name="lavra" options={{ title: t('painel.farmTitle') }} />
      <Stack.Screen name="produtos" options={{ title: t('painel.productsTitle') }} />
      <Stack.Screen name="encomendas" options={{ title: t('painel.ordersTitle') }} />
      <Stack.Screen name="monitorizacao" options={{ title: t('painel.monitoringTitle') }} />
      <Stack.Screen name="solo" options={{ title: t('painel.soilTitle') }} />
    </Stack>
  )
}
