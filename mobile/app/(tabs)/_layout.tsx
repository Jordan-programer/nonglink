import { Tabs } from 'expo-router'
import { Text, type ColorValue } from 'react-native'
import { colors } from '../../theme/colors'

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.leaf700,
        tabBarInactiveTintColor: 'rgba(15,36,17,0.45)',
        tabBarStyle: {
          backgroundColor: colors.cream50,
          borderTopColor: colors.leaf100,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <TabIcon glyph="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mercado"
        options={{
          title: 'Mercado',
          tabBarIcon: ({ color }) => <TabIcon glyph="🛒" color={color} />,
        }}
      />
    </Tabs>
  )
}
