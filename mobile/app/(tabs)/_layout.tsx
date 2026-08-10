import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { colors } from '../../theme/colors'

export default function TabLayout() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const isFarmer = user?.role === 'farmer'
  const isBuyerOrDistributor = user?.role === 'buyer' || user?.role === 'distributor'
  const isTransporter = user?.role === 'transporter'
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.leaf700,
        tabBarInactiveTintColor: 'rgba(15,36,17,0.45)',
        tabBarStyle: {
          backgroundColor: colors.cream50,
          borderTopColor: colors.leaf100,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mercado"
        options={{
          title: t('tabs.market'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Protected guard={isFarmer}>
        <Tabs.Screen
          name="painel"
          options={{
            title: t('tabs.dashboard'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={isBuyerOrDistributor}>
        <Tabs.Screen
          name="encomendas"
          options={{
            title: t('tabs.orders'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="clipboard-list-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={isTransporter}>
        <Tabs.Screen
          name="entregas"
          options={{
            title: t('tabs.deliveries'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="truck-delivery-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={isAdmin}>
        <Tabs.Screen
          name="admin"
          options={{
            title: t('tabs.admin'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-account-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs.Protected>

      <Tabs.Screen
        name="perfil"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
