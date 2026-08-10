import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboarding } from '../context/OnboardingContext'
import { setLanguage, supportedLanguages } from '../i18n'
import { colors } from '../theme/colors'

const SLIDES = [
  { icon: 'sprout' as const, key: 'slide1' },
  { icon: 'water-percent' as const, key: 'slide2' },
  { icon: 'store' as const, key: 'slide3' },
]

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const { completeOnboarding } = useOnboarding()
  const [step, setStep] = useState(0)

  const totalSteps = SLIDES.length + 1
  const isLanguageStep = step === 0
  const slide = isLanguageStep ? null : SLIDES[step - 1]

  function next() {
    if (step < totalSteps - 1) setStep(step + 1)
    else completeOnboarding()
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        {isLanguageStep ? (
          <>
            <MaterialCommunityIcons name="translate" size={48} color={colors.leaf600} />
            <Text style={styles.title}>{t('onboarding.chooseLanguage')}</Text>
            <View style={styles.languageGrid}>
              {supportedLanguages.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  style={[
                    styles.languageCard,
                    i18n.language === lang.code && styles.languageCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.languageLabel,
                      i18n.language === lang.code && styles.languageLabelActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={slide!.icon} size={48} color={colors.leaf600} />
            </View>
            <Text style={styles.title}>{t(`onboarding.${slide!.key}Title`)}</Text>
            <Text style={styles.subtitle}>{t(`onboarding.${slide!.key}Text`)}</Text>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.nextButton} onPress={next}>
          <Text style={styles.nextButtonText}>
            {step < totalSteps - 1 ? t('onboarding.next') : t('onboarding.start')}
          </Text>
        </Pressable>

        {step < totalSteps - 1 && (
          <Pressable onPress={completeOnboarding}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    height: 96,
    width: 96,
    borderRadius: 48,
    backgroundColor: colors.leaf100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.leaf950,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(15,36,17,0.65)',
    textAlign: 'center',
  },
  languageGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  languageCard: {
    minWidth: 130,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingVertical: 18,
    alignItems: 'center',
  },
  languageCardActive: {
    borderColor: colors.leaf700,
    backgroundColor: colors.leaf50,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.leaf950,
  },
  languageLabelActive: {
    color: colors.leaf800,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.leaf200,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.leaf700,
  },
  nextButton: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.5)',
  },
})
