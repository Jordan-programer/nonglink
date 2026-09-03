import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
  ApiError,
  fetchMyTransporterProfile,
  submitVehicle,
  uploadTransporterDocument,
  type TransporterDocumentType,
  type TransporterProfile,
} from '../../../lib/api'
import { colors } from '../../../theme/colors'

const DOCUMENT_TYPES: TransporterDocumentType[] = [
  'driver_license',
  'vehicle_registration',
  'insurance',
  'inspection',
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: colors.earth100, text: colors.earth700 },
  approved: { bg: colors.leaf100, text: colors.leaf700 },
  rejected: { bg: '#fee2e2', text: '#b91c1c' },
}

export default function VeiculoDocumentos() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [profile, setProfile] = useState<TransporterProfile | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [plate, setPlate] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [capacityKg, setCapacityKg] = useState('')
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  const [savingVehicle, setSavingVehicle] = useState(false)

  const [uploadingType, setUploadingType] = useState<TransporterDocumentType | null>(null)
  const [docError, setDocError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchMyTransporterProfile(token).then((res) => {
      setProfile(res)
      if (res.vehicle) {
        setPlate(res.vehicle.plate)
        setVehicleType(res.vehicle.vehicle_type)
        setCapacityKg(String(res.vehicle.capacity_kg))
      }
      setStatus('ready')
    })
  }, [token])

  async function handleSaveVehicle() {
    if (!token) return
    setVehicleError(null)
    setSavingVehicle(true)
    try {
      const updated = await submitVehicle(
        { plate, vehicle_type: vehicleType, capacity_kg: Number(capacityKg) },
        token,
      )
      setProfile(updated)
    } catch (err) {
      setVehicleError(err instanceof ApiError ? err.message : t('veiculoDocumentos.vehicleError'))
    } finally {
      setSavingVehicle(false)
    }
  }

  async function handlePickDocument(type: TransporterDocumentType) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setDocError(t('veiculoDocumentos.permissionError'))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    })
    if (result.canceled || !token) return

    setDocError(null)
    setUploadingType(type)
    try {
      const updated = await uploadTransporterDocument(type, result.assets[0].uri, token)
      setProfile(updated)
    } catch (err) {
      setDocError(err instanceof ApiError ? err.message : t('veiculoDocumentos.docError'))
    } finally {
      setUploadingType(null)
    }
  }

  const documentLabels: Record<TransporterDocumentType, string> = {
    driver_license: t('veiculoDocumentos.docDriverLicense'),
    vehicle_registration: t('veiculoDocumentos.docVehicleRegistration'),
    insurance: t('veiculoDocumentos.docInsurance'),
    inspection: t('veiculoDocumentos.docInspection'),
  }

  if (status === 'loading' || !profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leaf700} />
      </View>
    )
  }

  const statusColor = STATUS_COLORS[profile.verification_status]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
        <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
          {t(`veiculoDocumentos.status.${profile.verification_status}`)}
        </Text>
      </View>

      {profile.verification_status === 'pending' && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{t('veiculoDocumentos.pendingNotice')}</Text>
        </View>
      )}
      {profile.verification_status === 'rejected' && (
        <View style={[styles.noticeBox, { backgroundColor: '#fee2e2' }]}>
          <Text style={[styles.noticeText, { color: '#b91c1c' }]}>
            {t('veiculoDocumentos.rejectedNotice')}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('veiculoDocumentos.vehicleTitle')}</Text>
      <View style={styles.formCard}>
        <Text style={styles.label}>{t('veiculoDocumentos.plate')}</Text>
        <TextInput style={styles.input} value={plate} onChangeText={setPlate} />

        <Text style={styles.label}>{t('veiculoDocumentos.vehicleType')}</Text>
        <TextInput
          style={styles.input}
          value={vehicleType}
          onChangeText={setVehicleType}
          placeholder={t('veiculoDocumentos.vehicleTypePlaceholder')}
        />

        <Text style={styles.label}>{t('veiculoDocumentos.capacity')}</Text>
        <TextInput
          style={styles.input}
          value={capacityKg}
          onChangeText={setCapacityKg}
          keyboardType="numeric"
        />

        {vehicleError && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{vehicleError}</Text>
          </View>
        )}

        <Pressable
          style={styles.saveButton}
          disabled={savingVehicle}
          onPress={handleSaveVehicle}
        >
          <Text style={styles.saveButtonText}>
            {savingVehicle ? t('veiculoDocumentos.saving') : t('veiculoDocumentos.saveVehicle')}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{t('veiculoDocumentos.documentsTitle')}</Text>
      <Text style={styles.sectionSubtitle}>{t('veiculoDocumentos.documentsSubtitle')}</Text>

      {docError && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{docError}</Text>
        </View>
      )}

      <View style={{ gap: 10 }}>
        {DOCUMENT_TYPES.map((type) => {
          const existing = profile.documents.find((d) => d.document_type === type)
          return (
            <View key={type} style={styles.docRow}>
              <View style={styles.docInfo}>
                {existing ? (
                  <Image source={{ uri: existing.file_url }} style={styles.docThumb} />
                ) : (
                  <View style={[styles.docThumb, styles.docThumbEmpty]}>
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={20}
                      color="rgba(15,36,17,0.3)"
                    />
                  </View>
                )}
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.docLabel}>{documentLabels[type]}</Text>
                  <Text style={styles.docStatus}>
                    {existing
                      ? t('veiculoDocumentos.uploaded')
                      : t('veiculoDocumentos.notUploaded')}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.uploadButton}
                disabled={uploadingType !== null}
                onPress={() => handlePickDocument(type)}
              >
                <Text style={styles.uploadButtonText}>
                  {uploadingType === type
                    ? t('veiculoDocumentos.uploading')
                    : existing
                      ? t('veiculoDocumentos.replace')
                      : t('veiculoDocumentos.upload')}
                </Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream50,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream50,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noticeBox: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: colors.earth50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeText: {
    fontSize: 13,
    color: colors.earth800,
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '700',
    color: colors.leaf950,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(15,36,17,0.6)',
  },
  formCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 14,
    gap: 4,
  },
  label: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.7)',
  },
  input: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.leaf950,
  },
  saveButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.leaf100,
    backgroundColor: '#fff',
    padding: 12,
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  docThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  docThumbEmpty: {
    backgroundColor: colors.leaf50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.leaf950,
  },
  docStatus: {
    marginTop: 1,
    fontSize: 11,
    color: 'rgba(15,36,17,0.6)',
  },
  uploadButton: {
    borderRadius: 999,
    backgroundColor: colors.leaf700,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  uploadButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
})
