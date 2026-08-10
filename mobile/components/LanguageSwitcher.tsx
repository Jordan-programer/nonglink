import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { setLanguage, supportedLanguages } from '../i18n'
import { colors } from '../theme/colors'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <View style={styles.row}>
      {supportedLanguages.map((lang) => (
        <Pressable
          key={lang.code}
          onPress={() => setLanguage(lang.code)}
          style={[styles.chip, i18n.language === lang.code && styles.chipActive]}
        >
          <Text style={[styles.chipText, i18n.language === lang.code && styles.chipTextActive]}>
            {lang.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.leaf200,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: colors.leaf600,
    backgroundColor: colors.leaf700,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  chipTextActive: {
    color: '#fff',
  },
})
