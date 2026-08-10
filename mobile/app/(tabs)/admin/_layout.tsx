import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors } from '../../../theme/colors'

export default function AdminLayout() {
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
      <Stack.Screen name="index" options={{ title: t('admin.title') }} />
      <Stack.Screen name="utilizadores" options={{ title: t('admin.usersTitle') }} />
    </Stack>
  )
}
