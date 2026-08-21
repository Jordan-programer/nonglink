import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { colors } from '../theme/colors'

export default function PoliticaPrivacidade() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const sections = t('privacyPolicy.sections', { returnObjects: true }) as {
    heading: string
    body: string[]
  }[]

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.leaf950} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('privacyPolicy.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>{t('privacyPolicy.lastUpdated')}</Text>
        <Text style={styles.intro}>{t('privacyPolicy.intro')}</Text>

        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            {section.body.map((paragraph, i) => (
              <Text key={i} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.leaf100,
    backgroundColor: colors.cream50,
  },
  backButton: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '700',
    color: colors.leaf950,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(15,36,17,0.5)',
  },
  intro: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(15,36,17,0.8)',
  },
  section: {
    marginTop: 24,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.leaf950,
  },
  paragraph: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(15,36,17,0.7)',
  },
})
