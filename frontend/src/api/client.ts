export type Country = {
  id: number
  name: string
  code: string
}

export type Region = {
  id: number
  name: string
  country_id: number
  country_name: string
  latitude: number | null
  longitude: number | null
}

export type CropCategory =
  | 'cereais'
  | 'leguminosas'
  | 'tuberculos'
  | 'frutas'
  | 'hortalicas'
  | 'outros'

export type Crop = {
  id: number
  name: string
  category: CropCategory
  default_unit: string
}

export type ProductQuality = 'A' | 'B' | 'C'
export type ProductCertification = 'none' | 'organic' | 'in_transition'

export type HarvestStatus = 'planted' | 'growing' | 'harvested' | 'cancelled'

export type Harvest = {
  id: number
  farm_id: number
  crop_id: number
  planted_at: string
  expected_harvest_at: string
  actual_harvest_at: string | null
  expected_quantity: number | null
  status: HarvestStatus
  created_at: string
}

export type Product = {
  id: number
  farm_id: number
  name: string
  description: string | null
  image_url: string | null
  crop_id: number
  crop_name: string
  crop_category: CropCategory
  unit: string
  price_per_unit: number
  quantity_available: number
  quality: ProductQuality | null
  certification: ProductCertification
  farm_name: string
  farm_owner_id: number
  farm_owner_name: string
}

export type UserRole = 'farmer' | 'buyer' | 'distributor' | 'transporter' | 'admin' | 'superadmin'

export type User = {
  id: number
  name: string
  email: string
  phone: string | null
  role: UserRole
  region_id: number | null
  is_active: boolean
  email_verified: boolean
  country_id: number | null
  country_name: string | null
  profile_photo_url: string | null
  bio: string | null
}

export type AuthResponse = {
  access_token: string
  token_type: string
  user: User
}

export type Farm = {
  id: number
  owner_id: number
  name: string
  location: string | null
  latitude: number | null
  longitude: number | null
  size_hectares: number | null
  region_id: number | null
  boundary_geojson: string | null
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export type OrderItem = {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
}

export type PaymentMethod = {
  id: number
  name: string
  code: string
}

export type PaymentStatus = 'pending' | 'paid' | 'failed'

export type Order = {
  id: number
  buyer_id: number
  payment_method: PaymentMethod | null
  status: OrderStatus
  payment_status: PaymentStatus
  total_amount: number
  created_at: string
  items: OrderItem[]
}

export type Sale = {
  order_id: number
  order_item_id: number
  status: OrderStatus
  created_at: string
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  buyer_name: string
  buyer_email: string
}

export type AdminOrder = Order & {
  buyer_name: string
  buyer_email: string
}

export type TransportOrder = Order & {
  buyer_name: string
  buyer_phone: string | null
}

export type TransportRoute = {
  id: number
  origin_region_id: number
  origin_region_name: string
  destination_region_id: number
  destination_region_name: string
  created_at: string
}

export type PopularRoute = {
  origin_region_id: number
  origin_region_name: string
  destination_region_id: number
  destination_region_name: string
  order_count: number
}

export type AdminFarm = Farm & {
  owner_name: string
}

export type UsersByRole = {
  farmer: number
  buyer: number
  distributor: number
  transporter: number
  admin: number
  superadmin: number
}

export type AdminStats = {
  total_users: number
  users_by_role: UsersByRole
  total_farms: number
  total_products: number
  total_orders: number
  pending_orders: number
  total_revenue: number
  total_harvests: number
  total_routes: number
  active_deliveries: number
}

export type TrendPoint = {
  day: string
  value: number
}

export type AdminTrends = {
  new_users: TrendPoint[]
  revenue: TrendPoint[]
  new_orders: TrendPoint[]
}

export type SuggestionConfidence = 'alta' | 'media' | 'baixa'

export type SuggestionFactor = {
  label: string
  delta_pct: number
}

export type PriceSuggestion = {
  status: string
  suggestion_id: number | null
  crop_id: number
  region_id: number
  base_price: number | null
  suggested_price: number | null
  range_low: number | null
  range_high: number | null
  confidence: SuggestionConfidence | null
  factors: SuggestionFactor[]
  price_forecast_status: string
  demand_forecast_status: string
  note: string | null
}

export type SensorType = 'soil_moisture' | 'temperature' | 'water_level' | 'humidity'

export type Sensor = {
  id: number
  farm_id: number
  type: SensorType
  label: string | null
}

export type SensorReading = {
  id: number
  sensor_id: number
  value: number
  recorded_at: string
}

export type SensorDailyAggregate = {
  day: string
  avg_value: number
  min_value: number
  max_value: number
  count: number
}

export type SensorAlert = {
  id: number
  sensor_id: number
  reading_id: number
  severity: 'critical'
  message: string
  acknowledged: boolean
  created_at: string
}

export type Message = {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  created_at: string
  read_at: string | null
}

export type Conversation = {
  id: number
  other_user_id: number
  other_user_name: string
  product_id: number | null
  product_name: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  updated_at: string
}

export type ConversationDetail = Conversation & {
  messages: Message[]
}

export type ExportBatchStatus = 'collecting' | 'certified' | 'claimed'

export type ExportBatch = {
  id: number
  crop_id: number
  crop_name: string
  origin_country_id: number
  origin_country_name: string
  destination_country_id: number
  destination_country_name: string
  min_volume_target: number
  total_volume: number
  status: ExportBatchStatus
  certification_document_url: string | null
  certification_hash: string | null
  contract_document_url: string | null
  contract_hash: string | null
  claimed_by_id: number | null
  claimed_at: string | null
  created_at: string
}

export type ImporterVerificationStatus = 'pending' | 'verified' | 'rejected'

export type ImporterProfile = {
  id: number
  user_id: number
  company_name: string
  verification_status: ImporterVerificationStatus
  macau_registered: boolean
  created_at: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const API_BASE = '/api/v1'

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
      else if (Array.isArray(body.detail)) message = body.detail[0]?.msg ?? message
    } catch {
      // response wasn't JSON, keep the default message
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export function fetchProducts(): Promise<Product[]> {
  return request<Product[]>('/products/')
}

export function fetchProduct(id: number | string): Promise<Product> {
  return request<Product>(`/products/${id}`)
}

export function fetchCountries(): Promise<Country[]> {
  return request<Country[]>('/countries/')
}

export function fetchRegions(countryId?: number): Promise<Region[]> {
  const query = countryId ? `?country_id=${countryId}` : ''
  return request<Region[]>(`/regions/${query}`)
}

export function fetchCrops(): Promise<Crop[]> {
  return request<Crop[]>('/crops/')
}

export function registerUser(payload: {
  name: string
  email: string
  password: string
  role: UserRole
  phone?: string
  region_id: number
}): Promise<User> {
  return request<User>('/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: { identifier: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  })
}

export function loginWithFacebook(accessToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/facebook', {
    method: 'POST',
    body: JSON.stringify({ access_token: accessToken }),
  })
}

export function fetchMe(token: string): Promise<User> {
  return request<User>('/auth/me', { token })
}

export function verifyEmail(token: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export function resendVerificationEmail(token: string): Promise<void> {
  return request<void>('/auth/resend-verification', {
    method: 'POST',
    token,
  })
}

export function updateProfile(
  payload: Partial<{
    name: string
    email: string
    phone: string
    region_id: number
    role: UserRole
    bio: string
  }>,
  token: string,
): Promise<User> {
  return request<User>('/users/me', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function updatePassword(
  payload: { current_password: string; new_password: string },
  token: string,
): Promise<void> {
  return request<void>('/users/me/password', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function createOrder(
  items: { product_id: number; quantity: number }[],
  token: string,
  paymentMethodId?: number | null,
): Promise<Order> {
  return request<Order>('/orders/', {
    method: 'POST',
    token,
    body: JSON.stringify({ items, payment_method_id: paymentMethodId ?? null }),
  })
}

export function fetchMyOrders(token: string): Promise<Order[]> {
  return request<Order[]>('/orders/', { token })
}

export function fetchOrder(id: number, token: string): Promise<Order> {
  return request<Order>(`/orders/${id}`, { token })
}

export function setOrderPaymentMethod(
  orderId: number,
  paymentMethodId: number,
  token: string,
): Promise<Order> {
  return request<Order>(`/orders/${orderId}/payment-method`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ payment_method_id: paymentMethodId }),
  })
}

export function fetchMyPaymentMethods(token: string): Promise<PaymentMethod[]> {
  return request<PaymentMethod[]>('/payment-methods/mine', { token })
}

export function fetchPayPalClientId(): Promise<{ client_id: string; sdk_url: string }> {
  return request('/paypal/browser-safe-client-id')
}

export function createPayPalOrder(
  orderId: number,
  token: string,
): Promise<{ id: string; status: string }> {
  return request('/paypal/orders', {
    method: 'POST',
    token,
    body: JSON.stringify({ order_id: orderId }),
  })
}

export function capturePayPalOrder(
  paypalOrderId: string,
  token: string,
): Promise<{ id: string; status: string }> {
  return request(`/paypal/orders/${paypalOrderId}/capture`, { method: 'POST', token })
}

export function fetchMyFarms(token: string): Promise<Farm[]> {
  return request<Farm[]>('/farms/mine', { token })
}

export function createFarm(
  payload: {
    name: string
    location?: string
    latitude?: number
    longitude?: number
    size_hectares?: number
    region_id?: number
  },
  token: string,
): Promise<Farm> {
  return request<Farm>('/farms/', { method: 'POST', token, body: JSON.stringify(payload) })
}

export function updateFarm(
  id: number,
  payload: Partial<{
    name: string
    location: string
    latitude: number
    longitude: number
    size_hectares: number
    region_id: number
    boundary_geojson: string
  }>,
  token: string,
): Promise<Farm> {
  return request<Farm>(`/farms/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export type SatelliteSource = 'landsat_8' | 'landsat_9'

export type SoilRecommendationCategory = 'irrigation' | 'planting' | 'soil_treatment'

export type SoilRecommendation = {
  category: SoilRecommendationCategory
  level: string
}

export type SoilObservation = {
  id: number
  farm_id: number
  source: SatelliteSource
  acquisition_date: string
  cloud_cover_pct: number
  ndmi_mean: number | null
  ndmi_min: number | null
  ndmi_max: number | null
  lst_celsius_mean: number | null
  lst_celsius_min: number | null
  lst_celsius_max: number | null
  ndti_mean: number | null
  ndti_min: number | null
  ndti_max: number | null
  salinity_index_mean: number | null
  salinity_index_min: number | null
  salinity_index_max: number | null
  ndvi_mean: number | null
  ndvi_min: number | null
  ndvi_max: number | null
  created_at: string
  recommendations: SoilRecommendation[]
}

export function analyzeSoil(
  farmId: number,
  polygon: GeoJSON.Polygon | null,
  token: string,
): Promise<SoilObservation> {
  return request<SoilObservation>(`/soil/${farmId}/analyze`, {
    method: 'POST',
    token,
    body: JSON.stringify({ polygon }),
  })
}

export function fetchLatestSoilObservation(
  farmId: number,
  token: string,
): Promise<SoilObservation> {
  return request<SoilObservation>(`/soil/${farmId}/latest`, { token })
}

export function fetchSoilHistory(farmId: number, token: string): Promise<SoilObservation[]> {
  return request<SoilObservation[]>(`/soil/${farmId}/history`, { token })
}

export function fetchMyProducts(token: string): Promise<Product[]> {
  return request<Product[]>('/products/mine', { token })
}

export function joinExportBatch(
  payload: { product_id: number; quantity: number },
  token: string,
): Promise<ExportBatch> {
  return request<ExportBatch>('/export/batches/join', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function fetchMyExportBatches(token: string): Promise<ExportBatch[]> {
  return request<ExportBatch[]>('/export/batches/mine', { token })
}

export function fetchAvailableExportBatches(token: string): Promise<ExportBatch[]> {
  return request<ExportBatch[]>('/export/batches/available', { token })
}

export function claimExportBatch(batchId: number, token: string): Promise<ExportBatch> {
  return request<ExportBatch>(`/export/batches/${batchId}/claim`, {
    method: 'POST',
    token,
  })
}

export function fetchMyClaimedExportBatches(token: string): Promise<ExportBatch[]> {
  return request<ExportBatch[]>('/export/batches/mine/claimed', { token })
}

export function certifyExportBatch(batchId: number, token: string): Promise<ExportBatch> {
  return request<ExportBatch>(`/export/batches/${batchId}/certify`, {
    method: 'POST',
    token,
  })
}

export function createProduct(
  payload: {
    farm_id: number
    name: string
    description?: string
    image_url?: string
    crop_id: number
    unit?: string
    price_per_unit: number
    quantity_available?: number
    quality?: ProductQuality
    certification?: ProductCertification
    price_suggestion_id?: number
  },
  token: string,
): Promise<Product> {
  return request<Product>('/products/', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function updateProduct(
  id: number,
  payload: Partial<{
    name: string
    description: string
    image_url: string
    crop_id: number
    unit: string
    price_per_unit: number
    quantity_available: number
    quality: ProductQuality
    certification: ProductCertification
    price_suggestion_id: number
  }>,
  token: string,
): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function suggestPrice(
  payload: {
    crop_id: number
    region_id: number
    quality?: ProductQuality
    certification?: ProductCertification
    farm_id?: number
  },
  token?: string,
): Promise<PriceSuggestion> {
  return request<PriceSuggestion>('/market/price-suggestions', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function deleteProduct(id: number, token: string): Promise<void> {
  return request<void>(`/products/${id}`, { method: 'DELETE', token })
}

export function fetchSales(token: string): Promise<Sale[]> {
  return request<Sale[]>('/orders/sales', { token })
}

export function fetchSalesTrends(token: string): Promise<TrendPoint[]> {
  return request<TrendPoint[]>('/orders/sales/trends', { token })
}

export type EarningsSummary = {
  gross_sales: number
  commission_rate: number
  commission: number
  available_balance: number
}

export function fetchSalesSummary(token: string): Promise<EarningsSummary> {
  return request<EarningsSummary>('/orders/sales/summary', { token })
}

export function fetchTransportEarnings(token: string): Promise<EarningsSummary> {
  return request<EarningsSummary>('/transport/earnings', { token })
}

export function fetchSensors(): Promise<Sensor[]> {
  return request<Sensor[]>('/sensors/')
}

export function fetchSensorReadings(sensorId: number): Promise<SensorReading[]> {
  return request<SensorReading[]>(`/sensors/${sensorId}/readings`)
}

export function fetchSensorDailyReadings(sensorId: number): Promise<SensorDailyAggregate[]> {
  return request<SensorDailyAggregate[]>(`/sensors/${sensorId}/readings/daily`)
}

export function fetchMyAlerts(token: string): Promise<SensorAlert[]> {
  return request<SensorAlert[]>('/sensors/alerts/mine', { token })
}

export function acknowledgeAlert(alertId: number, token: string): Promise<SensorAlert> {
  return request<SensorAlert>(`/sensors/alerts/${alertId}/acknowledge`, {
    method: 'PATCH',
    token,
  })
}

export function fetchAdminStats(token: string): Promise<AdminStats> {
  return request<AdminStats>('/admin/stats', { token })
}

export function fetchAdminStatsTrends(token: string): Promise<AdminTrends> {
  return request<AdminTrends>('/admin/stats/trends', { token })
}

export function fetchAllUsers(token: string): Promise<User[]> {
  return request<User[]>('/users/', { token })
}

export function updateUserRole(id: number, role: UserRole, token: string): Promise<User> {
  return request<User>(`/users/${id}/role`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ role }),
  })
}

export function deleteUser(id: number, token: string): Promise<void> {
  return request<void>(`/users/${id}`, { method: 'DELETE', token })
}

export function updateUserStatus(
  id: number,
  isActive: boolean,
  token: string,
): Promise<User> {
  return request<User>(`/users/${id}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ is_active: isActive }),
  })
}

export function createAdmin(
  payload: { name: string; email: string; password: string; phone?: string; country_id: number },
  token: string,
): Promise<User> {
  return request<User>('/admin/users', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function fetchAllFarms(token: string): Promise<AdminFarm[]> {
  return request<AdminFarm[]>('/farms/', { token })
}

export function fetchAllOrders(token: string): Promise<AdminOrder[]> {
  return request<AdminOrder[]>('/orders/all', { token })
}

export function updateOrderStatus(
  id: number,
  orderStatus: OrderStatus,
  token: string,
): Promise<AdminOrder> {
  return request<AdminOrder>(`/orders/${id}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status: orderStatus }),
  })
}

export function fetchConversations(token: string): Promise<Conversation[]> {
  return request<Conversation[]>('/conversations/', { token })
}

export function fetchConversation(id: number, token: string): Promise<ConversationDetail> {
  return request<ConversationDetail>(`/conversations/${id}`, { token })
}

export function startConversation(
  payload: { recipient_id: number; product_id?: number; message: string },
  token: string,
): Promise<ConversationDetail> {
  return request<ConversationDetail>('/conversations/', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function sendMessage(
  conversationId: number,
  content: string,
  token: string,
): Promise<Message> {
  return request<Message>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify({ content }),
  })
}

export function fetchMyHarvests(token: string): Promise<Harvest[]> {
  return request<Harvest[]>('/harvests/mine', { token })
}

export function createHarvest(
  payload: {
    farm_id: number
    crop_id: number
    planted_at: string
    expected_harvest_at: string
    expected_quantity?: number
  },
  token: string,
): Promise<Harvest> {
  return request<Harvest>('/harvests/', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function updateHarvest(
  id: number,
  payload: Partial<{
    expected_harvest_at: string
    actual_harvest_at: string
    expected_quantity: number
    status: HarvestStatus
  }>,
  token: string,
): Promise<Harvest> {
  return request<Harvest>(`/harvests/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export async function uploadProductImage(
  file: File,
  token: string,
): Promise<{ image_url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/products/upload-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      // response wasn't JSON, keep the default message
    }
    throw new ApiError(message, res.status)
  }

  return res.json()
}

export async function uploadProfilePhoto(file: File, token: string): Promise<User> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/users/me/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      // response wasn't JSON, keep the default message
    }
    throw new ApiError(message, res.status)
  }

  return res.json()
}

export function fetchAvailableDeliveries(token: string): Promise<TransportOrder[]> {
  return request<TransportOrder[]>('/transport/available', { token })
}

export function fetchMyDeliveries(token: string): Promise<TransportOrder[]> {
  return request<TransportOrder[]>('/transport/mine', { token })
}

export function fetchDeliveriesTrends(token: string): Promise<TrendPoint[]> {
  return request<TrendPoint[]>('/transport/deliveries/trends', { token })
}

export function claimDelivery(orderId: number, token: string): Promise<TransportOrder> {
  return request<TransportOrder>(`/transport/${orderId}/claim`, {
    method: 'PATCH',
    token,
  })
}

export function updateDeliveryStatus(
  orderId: number,
  status: 'shipped' | 'delivered',
  token: string,
): Promise<TransportOrder> {
  return request<TransportOrder>(`/transport/${orderId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  })
}

export function fetchMyRoutes(token: string): Promise<TransportRoute[]> {
  return request<TransportRoute[]>('/transport/routes/mine', { token })
}

export function fetchPopularRoutes(token: string): Promise<PopularRoute[]> {
  return request<PopularRoute[]>('/transport/routes/popular', { token })
}

export function createRoute(
  payload: { origin_region_id: number; destination_region_id: number },
  token: string,
): Promise<TransportRoute> {
  return request<TransportRoute>('/transport/routes', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function deleteRoute(routeId: number, token: string): Promise<void> {
  return request<void>(`/transport/routes/${routeId}`, { method: 'DELETE', token })
}
