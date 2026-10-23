// AVTOMATIK GENERATSIYA QILINGAN — qo'lda tahrirlamang.
// Manba: backend OpenAPI (api/openapi.json) — Bazmly API 1.0.0
// Yangilash: npm run api:types [-- <openapi url yoki fayl>]

export interface AmenityRead {
  id: number;
  slug: string;
  name: string;
  icon_url?: string | null;
  sort_order: number;
}

export interface AvailableTableRead {
  id: number;
  number: number;
  seats: number;
  zone_id?: number | null;
}

/** Sana tanlashda kulrang ko'rinadigan band kunlar. */
export interface BlockedDatesRead {
  venue_id: number;
  dates: string[];
}

export interface BodyVenueMenuCreateItem {
  payload: MenuItemCreate;
  variants?: MenuItemVariantCreate[] | null;
}

export interface BookingCancel {
  reason?: string | null;
}

export interface BookingItemCreate {
  menu_item_id: number;
  quantity: number;
}

/**
 * `name_snapshot` va `unit_price` tasdiqlash paytida saqlab qolinadi.
 *
 * Eski chekni jonli `menu_items` bilan qayta qurish mumkin emas — narx va nom
 * o'zgaradi, chek esa kelishilgan qiymatni ko'rsatib turishi kerak.
 */
export interface BookingItemRead {
  id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  name_snapshot: string;
}

export type BookingKind = "table_reservation" | "hall_event";

/**
 * Joylar bo'limidagi karta.
 *
 * `qr_token` ataylab qaytarilmaydi — ro'yxatni skrinshot qilish oson, token
 * esa kelishni qayd etish uchun kalit.
 */
export interface BookingListItem {
  id: number;
  venue_id: number;
  venue_name: string;
  kind: BookingKind;
  status: BookingStatus;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  total_amount: string;
  currency: string;
  table_number?: number | null;
}

/**
 * Mijozning o'z broni — `qr_token` faqat shu javobda qaytariladi.
 *
 * Tokenni mijoz muassasaga ko'rsatadi va u bir marta ishlatiladi. Hech qanday
 * ro'yxatda va muassasa tomonidagi javoblarda ko'rinmaydi.
 */
export interface BookingOwnerDetail {
  booking: BookingRead;
  qr_token: string;
  venue_name: string;
  items?: BookingItemRead[];
  services?: BookingServiceRead[];
  price_lines?: PriceLineRead[];
}

/** Bronning muassasa tomonidan ko'riniladigan ma'lumoti. `qr_token` bu yerda ham yo'q. */
export interface BookingRead {
  id: number;
  user_id: number;
  venue_id: number;
  kind: BookingKind;
  status: BookingStatus;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  contact_name: string;
  contact_phone: string;
  note?: string | null;
  subtotal: string;
  deposit_amount: string;
  total_amount: string;
  currency: string;
  receipt_number: string;
  ticket_code: string;
  table_id?: number | null;
  guest_tier_id?: number | null;
  auto_cancel_at?: string | null;
  confirmed_at?: string | null;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  seated_minutes?: number | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
}

export interface BookingServiceCreate {
  venue_service_id: number;
  quantity?: number;
}

export interface BookingServiceRead {
  id: number;
  venue_service_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  name_snapshot: string;
}

export type BookingStatus =
  "pending" | "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show" | "expired";

/**
 * Konstruktorning 3-bosqichi: taomni qaysi filiallar va qanday narxda taqdim etadi.
 *
 * `venue_ids` ro'yxatiga kirmagan filialdan qator butunlay o'chiriladi — shu
 * sababli taom u yerda mavjud emas holatida emas, umuman ko'rinmaydi.
 */
export interface BranchAvailabilityUpdate {
  venue_ids: number[];
  price_overrides?: Record<string, number | string>;
}

export interface BranchListItem {
  id: number;
  name: string;
  tagline?: string | null;
  status: string;
}

export interface CheckInRequest {
  qr_token: string;
  venue_id: number;
}

export interface ConversationCreate {
  venue_id: number;
  booking_id?: number | null;
}

/**
 * Suhbatlar ro'yxatidagi qator: suhbat, oxirgi xabar va o'qilmaganlar soni.
 *
 * Yuboruvchining o'z xabarlari o'qilmagan deb hisoblanmaydi.
 */
export interface ConversationListItem {
  id: number;
  venue_id: number;
  user_id: number;
  booking_id?: number | null;
  last_message_at?: string | null;
  last_message?: MessageRead | null;
  unread_count?: number;
}

export interface ConversationRead {
  id: number;
  venue_id: number;
  user_id: number;
  booking_id?: number | null;
  last_message_at?: string | null;
}

/**
 * Boshqaruv panelining yig'ma ma'lumoti.
 *
 * `group_name` tarmoqqa tegishli; `is_open_now` va `queue_count` esa panel
 * ko'rsatayotgan filialga. Shu sababli ikkalasining identifikatori ham
 * alohida qaytariladi.
 */
export interface DashboardRead {
  group_id: number;
  group_name: string;
  venue_id?: number | null;
  venue_name?: string | null;
  is_open_now?: boolean;
  branches_total: number;
  branches_active: number;
  branches_closed: number;
  staff_total: number;
  staff_active: number;
  queue_count: number;
  month_revenue: string;
  month_bookings: number;
  avg_check: string;
  occupancy_percent: string;
  currency: string;
  comparison: PeriodComparisonRead;
  week: WeekdayBar[];
  today?: VenueDailyStatsRead | null;
}

export interface DeviceCreate {
  device_uuid: string;
  platform: DevicePlatform;
  app_version: string;
  push_token?: string | null;
}

export type DevicePlatform = "ios" | "android";

/** Qurilma ma'lumoti. `push_token` ro'yxatlarda qaytarilmaydi. */
export interface DeviceRead {
  id: number;
  device_uuid: string;
  platform: DevicePlatform;
  app_version: string;
  last_seen_at: string;
}

export interface DistrictCreate {
  region_id: number;
  name: string;
  latitude: number | string;
  longitude: number | string;
}

/** Tuman va shahar bir darajada — bitta jadval, bitta sxema. */
export interface DistrictRead {
  id: number;
  region_id: number;
  name: string;
  latitude: string;
  longitude: string;
}

/** Every field optional — PATCH, not PUT. */
export interface DistrictUpdate {
  region_id?: number | null;
  name?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface FavoriteCreate {
  venue_id: number;
}

export interface FavoriteRead {
  id: number;
  venue: VenueListItem;
}

export interface FavoriteToggled {
  venue_id: number;
  is_favorite: boolean;
}

export interface FriendshipCreate {
  addressee_id: number;
}

export interface FriendshipRead {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: FriendshipStatus;
}

export interface FriendshipRespond {
  accept: boolean;
}

export type FriendshipStatus = "pending" | "accepted" | "blocked";

/**
 * To'yxona tadbiri. Narx bosqichi `guests_count` asosida serverda aniqlanadi,
 * mijoz o'zi tanlamaydi.
 */
export interface HallEventCreate {
  venue_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  contact_name: string;
  contact_phone: string;
  note?: string | null;
  services?: BookingServiceCreate[];
  venue_service_ids?: number[];
}

export interface InvitationAccept {
  login: string;
  temporary_password: string;
  new_password: string;
}

/** Oshpaz navbati, eng eskisidan, stol raqami bilan. */
export interface KitchenQueueItem {
  id: number;
  order_id: number;
  table_number?: number | null;
  name_snapshot: string;
  variant_name_snapshot?: string | null;
  quantity: number;
  status: OrderItemStatus;
  note?: string | null;
  added_at: string;
}

export interface MenuCategoryCreate {
  name: string;
  sort_order?: number;
}

/** `item_count` jonli hisoblanadi — kategoriya yonidagi son saqlanmaydi. */
export interface MenuCategoryRead {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  item_count?: number;
}

export interface MenuItemCreate {
  menu_category_id: number;
  name: string;
  description?: string | null;
  base_price?: number | string | null;
  currency?: string;
  photo_url?: string | null;
  has_variants?: boolean;
  discount_percent?: number | string | null;
  sort_order?: number;
}

/**
 * Menyu katakchasi. `effective_price` filial narxi bilan hisoblangan.
 *
 * Porsiyalab sotiladigan taomning o'z narxi yo'q — `price_from` eng arzon
 * porsiyaning shu filialdagi narxi.
 */
export interface MenuItemListItem {
  id: number;
  menu_category_id: number;
  category_name: string;
  name: string;
  description?: string | null;
  photo_url?: string | null;
  effective_price?: string | null;
  price_from?: string | null;
  currency: string;
  discount_percent?: string | null;
  has_variants: boolean;
  is_available: boolean;
  status: MenuItemStatus;
}

export interface MenuItemRead {
  id: number;
  menu_category_id: number;
  name: string;
  description?: string | null;
  base_price?: string | null;
  effective_price?: string | null;
  currency: string;
  photo_url?: string | null;
  has_variants: boolean;
  discount_percent?: string | null;
  sort_order: number;
  is_available: boolean;
  status: MenuItemStatus;
  variants?: MenuItemVariantRead[];
}

export type MenuItemStatus = "active" | "hidden" | "out_of_stock";

export interface MenuItemVariantCreate {
  name: string;
  price: number | string;
  sort_order?: number;
}

/** Kichik / O'rtacha / Katta. `effective_price` — filial narxi bilan hisoblangan qiymat. */
export interface MenuItemVariantRead {
  id: number;
  name: string;
  price: string;
  effective_price: string;
  sort_order: number;
  is_active: boolean;
}

export interface MessageCreate {
  body: string;
}

export interface MessageRead {
  id: number;
  conversation_id: number;
  sender_type: MessageSenderType;
  sender_user_id: number;
  body: string;
  read_at?: string | null;
  created_at: string;
}

export type MessageSenderType = "user" | "venue";

/**
 * Qayerdaman: koordinatadan tuman va viloyat.
 *
 * `distance_m` — nuqtadan tuman markazigacha. Mamlakatdan tashqaridagi
 * koordinata ham eng yaqin tumanni qaytaradi, shuning uchun masofa kerak:
 * mijoz uni ko'rib, javob ma'noli yoki yo'qligini hal qiladi.
 */
export interface NearestDistrictRead {
  district_id: number;
  district_name: string;
  region_id: number;
  region_name: string;
  latitude: string;
  longitude: string;
  distance_m: number;
}

/** Xabarlar ekrani `sent_at` bo'yicha Bugun / Shu hafta / Shu oy ga ajratadi. */
export interface NotificationRead {
  id: number;
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown> | null;
  read_at?: string | null;
  sent_at: string;
}

export interface OrderCancel {
  reason?: string | null;
}

export interface OrderDetailRead {
  order: OrderRead;
  items?: OrderItemRead[];
  payments?: OrderPaymentRead[];
  paid_amount: string;
  elapsed_seconds?: number;
}

export interface OrderItemCreate {
  menu_item_id: number;
  variant_id?: number | null;
  quantity: number;
  note?: string | null;
}

/**
 * Har bir taomning alohida holati bor, chunki Oshpaz alohida rol: oshxona navbati
 * chek emas, taom bo'yicha tuziladi.
 */
export interface OrderItemRead {
  id: number;
  menu_item_id: number;
  variant_id?: number | null;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  total_price: string;
  name_snapshot: string;
  variant_name_snapshot?: string | null;
  status: OrderItemStatus;
  note?: string | null;
  added_at: string;
  served_at?: string | null;
}

export type OrderItemStatus = "new" | "sent_to_kitchen" | "cooking" | "ready" | "served" | "cancelled";

export type OrderKind = "dine_in" | "takeaway";

/**
 * Buyurtmalar kartasi. `elapsed_seconds` o'qish paytida hisoblanadi —
 * kartadagi taymer hech qachon saqlanmaydi.
 */
export interface OrderListItem {
  id: number;
  order_number: number;
  table_id?: number | null;
  table_number?: number | null;
  status: OrderStatus;
  kind: OrderKind;
  guests_count?: number | null;
  total_amount: string;
  currency: string;
  opened_at: string;
  elapsed_seconds?: number;
}

export interface OrderOpen {
  table_id: number;
  guests_count?: number | null;
  kind?: OrderKind;
}

export interface OrderPaymentCreate {
  method: OrderPaymentMethod;
  amount: number | string;
  provider_transaction_id?: string | null;
  change_amount?: number | string | null;
}

export type OrderPaymentMethod = "cash" | "card" | "transfer" | "click" | "payme" | "other";

/** Bo'lib to'lash bitta buyurtma va bir necha qator bo'ladi. */
export interface OrderPaymentRead {
  id: number;
  method: OrderPaymentMethod;
  amount: string;
  currency: string;
  paid_at: string;
  change_amount?: string | null;
}

export interface OrderRead {
  id: number;
  venue_id: number;
  table_id?: number | null;
  booking_id?: number | null;
  order_number: number;
  business_date: string;
  kind: OrderKind;
  status: OrderStatus;
  guests_count?: number | null;
  waiter_staff_id?: number | null;
  subtotal: string;
  discount_amount: string;
  service_charge: string;
  total_amount: string;
  currency: string;
  opened_at: string;
  closed_at?: string | null;
  cancelled_at?: string | null;
}

export type OrderStatus = "open" | "in_progress" | "served" | "awaiting_payment" | "completed" | "cancelled";

/** Parol hali o'rnatilmagan bo'lsa `current_password` talab qilinmaydi. */
export interface PasswordChange {
  current_password?: string | null;
  new_password: string;
}

/**
 * Ikkala davr jami va o'qish paytida hisoblangan farq.
 *
 * Foiz hech qachon saqlanmaydi: kechikkan bekor qilish kelishi bilan
 * saqlangan qiymat noto'g'ri bo'lib qoladi.
 */
export interface PeriodComparisonRead {
  current: StatsTotalsRead;
  previous: StatsTotalsRead;
  revenue_delta_percent?: string | null;
  bookings_delta_percent?: string | null;
}

/** Kirishning birinchi qadami: raqam yuboriladi, boshqa hech narsa emas. */
export interface PhoneCheck {
  phone: string;
}

/**
 * Mijoz keyin qaysi ekranni ko'rsatishini shu javob hal qiladi.
 *
 * Bu yerda ataylab token ham, foydalanuvchi haqidagi ma'lumot ham yo'q — bu
 * autentifikatsiya emas, faqat yo'nalish.
 */
export interface PhoneCheckResult {
  phone: string;
  registered: boolean;
  password_required: boolean;
}

/**
 * Mavjud raqam bilan kirish.
 *
 * `password` bu yerda `Password` emas: hisobda saqlangan eski parol yangi
 * uzunlik qoidasiga mos kelmasligi mumkin, va uzunlikni bu yerda rad etish
 * "parol noto'g'ri" javobidan boshqa ma'no bermaydi.
 */
export interface PhoneLogin {
  phone: string;
  password?: string | null;
}

/**
 * Ikkinchi qadam, yangi raqam uchun: qolgan ma'lumot shu yerda kiritiladi.
 *
 * `password` ixtiyoriy. Berilsa, keyingi kirishlarda o'sha raqam uchun parol
 * talab qilinadi; berilmasa, kirish uchun telefon raqamning o'zi yetarli.
 */
export interface PhoneRegister {
  phone: string;
  first_name: string;
  last_name: string;
  password?: string | null;
  district_id?: number | null;
}

/** Batafsil narx hisobotining bir qatori, tasdiqlash paytida saqlab qolinadi. */
export interface PriceLineRead {
  id: number;
  sort_order: number;
  line_type: PriceLineType;
  label_snapshot: string;
  unit_price: string;
  quantity: number;
  amount: string;
}

export type PriceLineType = "hall_rental" | "catering" | "service_logistics" | "deposit";

/**
 * Chek bir marta yoziladi va hech qachon o'zgartirilmaydi.
 *
 * `payload` chop etilgan qatorlarni muzlatadi, shuning uchun ikki oydan keyin
 * qayta chiqarilgan chek menyudagi o'zgarishlardan qat'i nazar aynan bir xil
 * bo'ladi. Tuzatish — yangi buyurtma yoki pulni qaytarish, tahrir emas.
 */
export interface ReceiptRead {
  id: number;
  order_id: number;
  receipt_number: string;
  printed_at: string;
  fiscal_sign?: string | null;
  fiscal_serial?: string | null;
  payload: Record<string, unknown>;
  reprinted_count: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RegionCreate {
  name: string;
  code: string;
}

export interface RegionRead {
  id: number;
  name: string;
  code: string;
}

/** Every field optional — PATCH, not PUT. */
export interface RegionUpdate {
  name?: string | null;
  code?: string | null;
}

/** O'rtacha baho va sharhlar soni — muassasa reytingi shu yerdan qayta hisoblanadi. */
export interface ReviewAggregateRead {
  venue_id: number;
  average: string;
  count: number;
}

export interface ReviewCreate {
  booking_id: number;
  rating: number;
  comment?: string | null;
  photo_urls?: string[];
}

/** Tasdiqlangan belgisi `is_verified` — sharh bronga bog'langanini bildiradi. */
export interface ReviewListItem {
  id: number;
  rating: number;
  comment?: string | null;
  is_verified: boolean;
  published_at?: string | null;
  author: UserListItem;
  photos?: ReviewPhotoRead[];
}

export interface ReviewPhotoRead {
  id: number;
  url: string;
  sort_order: number;
}

export interface ReviewRead {
  id: number;
  user_id: number;
  venue_id: number;
  booking_id?: number | null;
  rating: number;
  comment?: string | null;
  is_verified: boolean;
  status: ReviewStatus;
  published_at?: string | null;
}

export type ReviewStatus = "pending" | "published" | "rejected";

export interface SeatedSummary {
  booking_id: number;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  seated_minutes?: number | null;
}

/** Platforma belgilagan yopiq ro'yxat: Dasturxon tuzash, Raqqoslar, Kartej va boshqalar. */
export interface ServiceCatalogRead {
  id: number;
  slug: string;
  name: string;
  icon_url?: string | null;
  applies_to_venue_type?: VenueTypeSlug | null;
  sort_order: number;
}

export type ServicePriceUnit = "flat" | "per_guest" | "per_hour";

/** Jami / Aktiv / Noaktiv. */
export interface StaffCountsRead {
  total: number;
  active: number;
  inactive: number;
}

export interface StaffInvitationCreate {
  full_name: string;
  phone: string;
  staff_role_id: number;
  venue_id?: number | null;
}

/**
 * Faqat yaratish javobida. Sirni tashiydigan yagona sxema.
 *
 * SMS yo'q, ya'ni hisob ma'lumotlarini hodimga yetkazadigan kanal ham yo'q:
 * ularni bir marta shu javobda ko'rsatib, muassasa egasining o'ziga topshirish
 * — taklifnomani umuman ishlatib bo'lmasligidan afzal. Sababi DECISIONS.md da.
 */
export interface StaffInvitationCreated {
  id: number;
  venue_group_id: number;
  venue_id?: number | null;
  full_name: string;
  phone: string;
  staff_role_id: number;
  accepted_at?: string | null;
  expires_at: string;
  login: string;
  temporary_password: string;
}

/** Hodimlar telefon raqami bilan emas, berilgan login bilan kiradi. */
export interface StaffLogin {
  login: string;
  password: string;
}

export interface StaffRoleRead {
  id: number;
  slug: string;
  scope: StaffRoleScope;
  name: string;
  sort_order: number;
}

export type StaffRoleScope = "group" | "venue";

export interface StatsTotalsRead {
  bookings_count: number;
  guests_count: number;
  no_show_count: number;
  cancelled_count: number;
  orders_count: number;
  revenue: string;
}

/**
 * Stollar taxtasidagi bitta katak.
 *
 * Bo'sh stol uchun `order` qiymati `None` bo'ladi. `venue_tables` da holat
 * ustuni yo'q, shuning uchun taxta buyurtmalar bilan zid kelmaydi.
 */
export interface TableBoardRow {
  table_id: number;
  number: number;
  seats: number;
  zone_id?: number | null;
  order?: OrderListItem | null;
}

/**
 * Boshlang'ich sozlashdagi sig'im guruhlari: `{2: 4, 4: 6, 8: 2}`.
 *
 * Bu kiritiladigan ma'lumot, saqlanadigan holat emas — server ularni
 * raqamlangan stollarga yoyadi, guruhlarning o'zi saqlanmaydi.
 */
export interface TableCountsCreate {
  counts: Record<string, number>;
  zone_id?: number | null;
}

/** Restoran stoli broni. Stol va ixtiyoriy menyu buyurtmasi bilan. */
export interface TableReservationCreate {
  venue_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  contact_name: string;
  contact_phone: string;
  note?: string | null;
  services?: BookingServiceCreate[];
  table_id: number;
  items?: BookingItemCreate[];
}

/** Faqat javob yuborish uchun kerak bo'lgan qism. */
export interface TelegramChat {
  id: number;
}

/**
 * `requestContact` javobi, o'zgartirilmagan holda.
 *
 * Imzo aynan shu satr uchun hisoblangan, shuning uchun uni qismlarga ajratib
 * yuborish mumkin emas — raqamni alohida yuborish tekshiruvni yo'q qiladi.
 */
export interface TelegramContactShare {
  contact_data: string;
}

/**
 * Mini App ochilganda Telegram bergan `initData` satri, o'zgartirilmagan holda.
 *
 * Bu satr imzolangan, shuning uchun uni qismlarga ajratib yuborish mumkin emas:
 * imzo aynan shu ko'rinish uchun hisoblangan.
 */
export interface TelegramLogin {
  init_data: string;
}

/** Botga kelgan xabar. */
export interface TelegramMessage {
  chat: TelegramChat;
  text?: string | null;
}

/**
 * Telegram webhookka yuboradigan yangilanish.
 *
 * Telegram bu yerga o'nlab turdagi yangilanish yuboradi va vaqt o'tishi bilan
 * yangilarini qo'shadi, shuning uchun sxema ataylab tor: notanish maydonlar
 * e'tiborsiz qoldiriladi, aks holda har bir yangi maydon 422 xatosiga
 * aylanardi va Telegram yetkazishni qayta urina boshlardi.
 */
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in_seconds: number;
  user_id: number;
  must_change_password?: boolean;
  profile_completed?: boolean;
}

export interface UnreadCountRead {
  unread: number;
}

export interface UserAddressCreate {
  district_id: number;
  label: string;
  latitude: number | string;
  longitude: number | string;
}

/** Oxirgi manzillar uchun. */
export interface UserAddressRead {
  id: number;
  district_id: number;
  label: string;
  latitude: string;
  longitude: string;
  last_used_at: string;
}

/** Hodimlar yoki do'stlar ro'yxati uchun qisqa ko'rinish — aloqa ma'lumotisiz. */
export interface UserListItem {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
}

/** Ism kiritilishi akkauntni `pending_profile` dan `active` ga o'tkazadi. */
export interface UserProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  district_id?: number | null;
  theme?: UserTheme | null;
}

/** Profil ma'lumoti. `password_hash` va `login` qaytarilmaydi. */
export interface UserRead {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  district_id?: number | null;
  role: UserRole;
  status: UserStatus;
  theme: UserTheme;
  created_at: string;
}

export type UserRole = "customer" | "venue_owner" | "venue_staff" | "moderator" | "admin";

export type UserStatus = "pending_profile" | "active" | "blocked" | "deleted";

export type UserTheme = "system" | "light" | "dark";

/**
 * Muassasa ro'yxati va QR qayd uchun bron: stol raqami va filial nomi bilan.
 *
 * Stollar taxtasi bronni stol raqami bo'yicha topadi, `table_id` bo'yicha emas —
 * raqam xodim zalda ko'radigan narsa.
 */
export interface VenueBookingRead {
  id: number;
  user_id: number;
  venue_id: number;
  kind: BookingKind;
  status: BookingStatus;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  contact_name: string;
  contact_phone: string;
  note?: string | null;
  subtotal: string;
  deposit_amount: string;
  total_amount: string;
  currency: string;
  receipt_number: string;
  ticket_code: string;
  table_id?: number | null;
  guest_tier_id?: number | null;
  auto_cancel_at?: string | null;
  confirmed_at?: string | null;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  seated_minutes?: number | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  venue_name: string;
  table_number?: number | null;
}

/**
 * Yangi filial.
 *
 * `venue_group_id` bu yerda yo'q: tarmoq so'rovning o'zidan keladi — yo yangi
 * yaratilgan tarmoqdan, yo `group_id` parametridan. Uni tanada ham so'rash
 * ikkita bir-biriga zid manba yaratardi.
 *
 * `owner_id` va `location` ham yo'q: birinchisi tarmoq egasidan olinadi,
 * ikkinchisi koordinatalardan hisoblanadi.
 */
export interface VenueCreate {
  district_id: number;
  street: string;
  house_number: string;
  latitude: number | string;
  longitude: number | string;
  phone: string;
  name: string;
  description?: string | null;
  tagline?: string | null;
  venue_type: VenueTypeSlug;
  amenity_ids?: number[];
  total_seats?: number | null;
  capacity_min?: number | null;
  capacity_max?: number | null;
  base_price?: number | string | null;
  currency?: string;
  min_advance_booking_days?: number;
  late_grace_minutes?: number;
  requires_deposit?: boolean;
  deposit_percent?: number | string | null;
  manager_user_id?: number | null;
}

export interface VenueDailyStatsRead {
  id: number;
  venue_id: number;
  business_date: string;
  bookings_count: number;
  guests_count: number;
  no_show_count: number;
  cancelled_count: number;
  orders_count: number;
  revenue: string;
  avg_check: string;
  occupancy_percent: string;
  computed_at: string;
}

/** Muassasa sahifasi — server tomonidan alohida so'rovlardan yig'iladi. */
export interface VenueDetailRead {
  venue: VenueRead;
  photos: VenuePhotoRead[];
  amenities: AmenityRead[];
  venue_type: VenueTypeSlug;
  working_hours: VenueWorkingHoursRead[];
  is_open_now?: boolean;
  guest_tiers?: VenueGuestTierRead[];
}

export interface VenueGroupCreate {
  primary_venue_type: VenueTypeSlug;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  default_currency?: string;
}

/** `logo_url` faqat shu yerda saqlanadi — filialning o'z logotipi yo'q. */
export interface VenueGroupRead {
  id: number;
  owner_id: number;
  primary_venue_type: VenueTypeSlug;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  default_currency: string;
  status: VenueGroupStatus;
}

export type VenueGroupStatus = "draft" | "active" | "blocked";

export interface VenueGroupUpdate {
  name?: string | null;
  description?: string | null;
  primary_venue_type?: VenueTypeSlug | null;
  logo_url?: string | null;
  default_currency?: string | null;
  status?: VenueGroupStatus | null;
}

/**
 * Tarmoq va uning birinchi filiali — bitta so'rovda.
 *
 * Ajratilmaydi, chunki `venues.venue_group_id` NOT NULL: ikki so'rov oralig'ida
 * filialsiz tarmoq holati paydo bo'lardi, va uni tozalash kimningdir ishi
 * bo'lib qolardi.
 */
export interface VenueGroupWithBranchCreate {
  group: VenueGroupCreate;
  branch: VenueCreate;
}

export interface VenueGroupWithBranchesRead {
  group: VenueGroupRead;
  branches: BranchListItem[];
}

/** To'yxona narx bosqichlari. `max_guests` bo'sh bo'lsa — bu ochiq yuqori bosqich. */
export interface VenueGuestTierRead {
  id: number;
  min_guests: number;
  max_guests?: number | null;
  base_price: string;
  sort_order: number;
}

/**
 * Bosh ekran yoki Filiallar kartasi.
 *
 * `distance_m` va `is_open_now` har bir qator uchun ma'lumotlar bazasida
 * hisoblanadi. `is_open_now` — soat bo'yicha holat, `status` esa ma'muriy
 * holat. Kartada ikkalasi bitta belgida ko'rinadi, API da esa ajratilgan.
 */
export interface VenueListItem {
  id: number;
  name: string;
  tagline?: string | null;
  venue_type: VenueTypeSlug;
  status: VenueStatus;
  street: string;
  house_number: string;
  capacity_min?: number | null;
  capacity_max?: number | null;
  rating_avg: string;
  reviews_count: number;
  base_price?: string | null;
  currency: string;
  discount_percent?: string | null;
  requires_deposit: boolean;
  distance_m?: number | null;
  is_open_now?: boolean;
  cover_url?: string | null;
}

export interface VenuePhotoRead {
  id: number;
  url: string;
  sort_order: number;
  is_cover: boolean;
}

export interface VenueRead {
  id: number;
  venue_group_id: number;
  name: string;
  description?: string | null;
  tagline?: string | null;
  district_id: number;
  venue_type: VenueTypeSlug;
  street: string;
  house_number: string;
  latitude: string;
  longitude: string;
  phone: string;
  total_seats?: number | null;
  capacity_min?: number | null;
  capacity_max?: number | null;
  base_price?: string | null;
  currency: string;
  min_advance_booking_days: number;
  late_grace_minutes: number;
  requires_deposit: boolean;
  deposit_percent?: string | null;
  discount_percent?: string | null;
  rating_avg: string;
  reviews_count: number;
  status: VenueStatus;
  onboarding_step: number;
  onboarded_at?: string | null;
}

/** Bosh ekran filtrlari — o'n beshta alohida parametr o'rniga bitta obyekt. */
export interface VenueSearchParams {
  query?: string | null;
  venue_type?: VenueTypeSlug | null;
  district_id?: number | null;
  guest_count?: number | null;
  min_rating?: number | string | null;
  requires_deposit?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  radius_m?: number | null;
  only_open_now?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface VenueServiceCreate {
  service_catalog_id: number;
  price: number | string;
  currency?: string;
  price_unit?: ServicePriceUnit;
  venue_id?: number | null;
  sort_order?: number;
  items?: VenueServiceItemCreate[];
}

export interface VenueServiceItemCreate {
  name: string;
  price: number | string;
  sort_order?: number;
}

/** Dasturxon tuzash ostidagi Taomlar qatorlari. */
export interface VenueServiceItemRead {
  id: number;
  name: string;
  price: string;
  sort_order: number;
}

/** `venue_id` bo'sh bo'lsa, narx butun tarmoq uchun amal qiladi. */
export interface VenueServiceRead {
  id: number;
  venue_group_id: number;
  venue_id?: number | null;
  service_catalog_id: number;
  name: string;
  price: string;
  currency: string;
  price_unit: ServicePriceUnit;
  is_active: boolean;
  sort_order: number;
  items?: VenueServiceItemRead[];
}

/** Hodimlar kartasi. Parol va login qaytarilmaydi — ular `users` da saqlanadi. */
export interface VenueStaffListItem {
  id: number;
  venue_id?: number | null;
  staff_role_id: number;
  role_name: string;
  is_active: boolean;
  user: UserListItem;
}

export interface VenueStaffRead {
  id: number;
  venue_group_id: number;
  venue_id?: number | null;
  user_id: number;
  staff_role_id: number;
  role_scope: string;
  is_active: boolean;
  invited_at: string;
  activated_at?: string | null;
  deactivated_at?: string | null;
}

export type VenueStatus = "draft" | "pending" | "active" | "blocked" | "closed";

/** Filiallar sarlavhasidagi Jami / Aktiv / Yopiq. */
export interface VenueStatusCountsRead {
  total: number;
  active: number;
  closed: number;
}

export interface VenueTableRead {
  id: number;
  number: number;
  seats: number;
  zone_id?: number | null;
  is_active: boolean;
}

export type VenueTypeSlug = "restoran" | "toyxona";

export interface VenueUpdate {
  name?: string | null;
  description?: string | null;
  tagline?: string | null;
  district_id?: number | null;
  street?: string | null;
  house_number?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  phone?: string | null;
  total_seats?: number | null;
  capacity_min?: number | null;
  capacity_max?: number | null;
  base_price?: number | string | null;
  min_advance_booking_days?: number | null;
  late_grace_minutes?: number | null;
  requires_deposit?: boolean | null;
  deposit_percent?: number | string | null;
  discount_percent?: number | string | null;
  manager_user_id?: number | null;
  venue_type?: VenueTypeSlug | null;
  status?: VenueStatus | null;
}

export interface VenueWorkingHoursRead {
  weekday: number;
  opens_at?: string | null;
  closes_at?: string | null;
  is_closed: boolean;
}

/** Umumiy — bu filtrsiz ko'rinish, alohida zona emas, shuning uchun bu ro'yxatda yo'q. */
export interface VenueZoneRead {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
}

/**
 * Telegram javob tanasini o'qimaydi — u faqat 200 statusini kutadi.
 *
 * Shunga qaramay bu yerda haqiqiy sxema turibdi: API dagi har bir yo'l
 * `response_model` e'lon qilishi shart, va bu qoidadan istisno qilish bitta
 * yo'lni hujjatsiz qoldirardi.
 */
export interface WebhookAck {
  ok?: boolean;
}

/** Haftalik grafikning bir ustuni. */
export interface WeekdayBar {
  weekday: number;
  bookings_count: number;
  revenue: string;
}

export interface WorkingHoursCreate {
  weekday: number;
  opens_at?: string | null;
  closes_at?: string | null;
  is_closed?: boolean;
}

/**
 * Butun hafta bir yo'la yoziladi.
 *
 * Tahrirlash yettala qatorni qayta yozadi, kunlarni taqqoslamaydi — shunda
 * olib tashlangan kun eski qator bo'lib qolmaydi.
 */
export interface WorkingHoursReplace {
  days: WorkingHoursCreate[];
}

// ---------- Qo'lda: umumiy tiplar ----------

/** Sahifalangan javob (backend: Page[T]) */
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Backend xato konverti: { code, message, details, request_id } — ilova `code` bo'yicha shart tuzadi */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
  request_id?: string;
}
