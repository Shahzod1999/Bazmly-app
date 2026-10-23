# Bazmly — mobil ilova uchun backend shartnomasi

Bu hujjat **backend'da hali mavjud bo'lmagan** endpointlarni tavsiflaydi. Mobil ilova ularni hozir mock bilan ishlatadi (`EXPO_PUBLIC_MOCK_OTP=true`, `EXPO_PUBLIC_MOCK_PAYMENTS=true`). Backend tayyor bo'lgach flaglar `false` qilinadi — ilova kodi o'zgarmaydi.

- Tiplar: `src/api/types.pending.ts`
- Mock implementatsiya: `src/api/services/otpService.ts`, `src/api/services/paymentService.ts`
- Bazaviy URL: `https://bazmly-backend-production.up.railway.app`, prefiks `/api/v1`
- Xato formati — mavjud API bilan bir xil:

```json
{ "code": "otp_invalid", "message": "Kod noto'g'ri.", "details": null, "request_id": "..." }
```

`message` foydalanuvchiga ko'rsatiladi, shuning uchun `Accept-Language` (`uz` | `ru` | `en`) sarlavhasiga qarab tarjima qilingan bo'lishi kerak. Ilova har bir so'rovda bu sarlavhani yuboradi.

---

## §1. SMS OTP orqali kirish (Eskiz.uz)

Telegram `initData` native ilovada ishlamaydi, shu sababli asosiy kirish usuli — telefon + SMS kod. Ro'yxatdan o'tish va kirish **bitta oqim**.

### 1.1 `POST /auth/otp/send`

```json
// so'rov
{ "phone": "+998901234567", "purpose": "login" }

// 200
{ "request_id": "b6f1…", "expires_in_seconds": 120, "resend_after_seconds": 60, "code_length": 6 }
```

| Status | `code` | Qachon |
|---|---|---|
| 400 | `phone_invalid` | Raqam `+998XXXXXXXXX` formatida emas |
| 429 | `otp_rate_limited` | Limit oshdi; `details.retry_after_seconds` majburiy |
| 403 | `user_blocked` | Foydalanuvchi bloklangan |

Talablar:
- Kod 6 xonali, kriptografik tasodifiy; bazada faqat hash saqlanadi.
- Muddati 120 s. Qayta yuborish 60 s dan keyin.
- Rate limit: bitta raqamga 1 daqiqada 1 ta, 1 soatda 5 ta; bitta IP'ga 1 soatda 20 ta.
- SMS matni Eskiz'da tasdiqlangan shablon bo'yicha. Android avtomatik o'qishi uchun oxirida app hash bo'lsin (SMS Retriever):
  `Bazmly: tasdiqlash kodi 123456. Hech kimga bermang.\n<APP_HASH>`
  App hash EAS build'dan keyin olinadi (`docs/RELEASE.md`).

### 1.2 `POST /auth/otp/verify`

```json
// so'rov
{ "request_id": "b6f1…", "phone": "+998901234567", "code": "123456" }

// 200 — TokenPair + 2 ta maydon
{
  "access_token": "…", "refresh_token": "…", "token_type": "bearer",
  "expires_in_seconds": 3600, "user_id": 42,
  "profile_completed": false,
  "is_new_user": true
}
```

| Status | `code` | Qachon |
|---|---|---|
| 400 | `otp_invalid` | Kod noto'g'ri |
| 400 | `otp_expired` | Muddat o'tgan yoki `request_id` topilmadi |
| 400 | `otp_attempts_exceeded` | 5 ta noto'g'ri urinish; `request_id` bekor qilinadi |

Xulq:
- Raqam bazada bo'lmasa — foydalanuvchi `status: pending_profile`, `role: customer` bilan yaratiladi va `is_new_user: true` qaytadi.
- `profile_completed: false` bo'lsa, ilova ism-familiya so'raydi va mavjud `POST /auth/complete-profile` ni chaqiradi.
- Muvaffaqiyatli tekshiruvdan keyin kod qayta ishlatilmaydi.

> **Mock rejimda** kod har doim `111111`. Tekshiruvdan keyin ilova mavjud `POST /auth/phone-check` va `POST /auth/login {phone}` endpointlariga murojaat qiladi; yangi raqam uchun esa ism kiritilgach `POST /auth/register` chaqiriladi. Backend `password_required: true` qaytarsa, mock kirish ishlamaydi. Bu faqat sinov uchun.

### 1.3 Mavjud endpointlar (o'zgarmaydi)

- `POST /auth/staff-login` — hamkor xodimlari login + parol bilan kiradi.
- `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/complete-profile`.

---

## §2. Karta saqlash va depozit to'lovi (UzCard / Humo)

To'lov ilova ichidagi forma orqali qilinadi: karta qo'shiladi → bank SMS kodi → karta saqlanadi → depozit → SMS kod.
**Karta raqami faqat backend'ga yuboriladi.** U to'lov provayderida (masalan, ATMOS, Multicard, Payme Business, Click Pass) tokenlashtiriladi. Bazada faqat token va maskali raqam saqlanadi. Ilova karta raqamini saqlamaydi va loglamaydi.

### 2.1 `POST /payments/cards`

```json
// so'rov
{ "card_number": "8600123412341234", "expiry": "12/28" }

// 200
{ "card_request_id": "c_9a…", "phone_mask": "+998 90 *** ** 67", "resend_after_seconds": 60 }
```

Provayder karta egasining telefoniga SMS kod yuboradi.

### 2.2 `POST /payments/cards/verify`

```json
// so'rov
{ "card_request_id": "c_9a…", "code": "123456" }

// 200 — SavedCard
{
  "id": 7,
  "masked_pan": "8600 **** **** 1234",
  "brand": "uzcard",
  "expiry": "12/28",
  "holder_name": "SHAHZOD B.",
  "is_default": true
}
```

Foydalanuvchining birinchi kartasi avtomatik `is_default: true` bo'ladi.

### 2.3 `GET /payments/cards` → `SavedCard[]`
### 2.4 `DELETE /payments/cards/{id}` → `204`

Bekor qilinmagan bron to'lovi jarayonida bo'lsa ham karta o'chiriladi. Provayderdagi token ham bekor qilinadi.

### 2.5 `POST /bookings/{id}/deposit`

```json
// so'rov
{ "card_id": 7 }

// 200
{ "payment_id": "p_51…", "status": "pending_otp", "amount": "2500000.00", "currency": "UZS", "phone_mask": "+998 90 *** ** 67" }
```

- Summa **backend'da** hisoblanadi: `booking.deposit_amount` (venue `deposit_percent` asosida). Ilova summa yubormaydi.
- Provayder SMS talab qilmasa, darhol `status: "paid"` qaytariladi.
- Bitta bron uchun bir vaqtda faqat bitta faol to'lov bo'ladi. Takroriy chaqiruv o'sha `payment_id` ni qaytaradi (idempotentlik).

### 2.6 `POST /payments/{payment_id}/confirm`

```json
// so'rov
{ "code": "123456" }

// 200
{ "status": "paid", "booking": { /* BookingOwnerDetail — yangilangan, status: "confirmed" yoki "pending" */ } }
```

### Xato kodlari (§2)

| `code` | Ma'nosi |
|---|---|
| `card_invalid` | Raqam noto'g'ri (Luhn / BIN) |
| `card_expired` | Muddati o'tgan |
| `card_not_supported` | UzCard/Humo emas |
| `card_otp_invalid` / `card_otp_expired` | SMS kod xato / muddati o'tgan |
| `insufficient_funds` | Mablag' yetarli emas |
| `payment_declined` | Bank rad etdi |
| `booking_not_payable` | Bron bekor qilingan, allaqachon to'langan yoki depozit talab qilinmaydi |

BIN qoidasi (ilova ham tekshiradi): `8600`, `5614` → UzCard; `9860` → Humo.

> **Mock rejimda** kartalar faqat maskali ko'rinishda qurilma xotirasida saqlanadi, SMS kod `111111`. To'lovdan keyin bron mavjud `GET /bookings/{id}` dan qayta o'qiladi.

### Webhook (tavsiya)

Provayder to'lov holatini webhook orqali yuborsa, backend bronni `confirmed` ga o'tkazishi va mijozga push yuborishi kerak (§3, `type: "booking_paid"`).

---

## §3. Push bildirishnomalar

`POST /users/me/devices` **mavjud**. Ilova yuboradi:

```json
{ "device_uuid": "lq8…", "platform": "ios", "app_version": "1.0.0", "push_token": "ExponentPushToken[xxxx]" }
```

- Ilova standart holatda **Expo push token** yuboradi. Backend xabarni Expo Push API orqali jo'natadi: `POST https://exp.host/--/api/v2/push/send`.
- Backend FCM/APNs bilan to'g'ridan-to'g'ri ishlashni tanlasa, ilovada `EXPO_PUBLIC_PUSH_TOKEN_KIND=native` qo'yiladi va native token yuboriladi.
- Logout'da ilova shu `device_uuid` bilan `push_token: null` yuboradi. Backend bu qurilmaga yuborishni to'xtatishi kerak.
- Kerakli Android kanallari: `bookings` (yuqori muhimlik) va `promotions`. Ularni `channelId` maydonida yuboring.

Payload (`data`) — ilova shu maydonlar bo'yicha ekran ochadi:

| `data.type` | Maydonlar | Ochiladigan ekran |
|---|---|---|
| `booking_confirmed`, `booking_rejected`, `booking_paid`, `booking_reminder`, `booking_auto_cancel` | `booking_id` | Chipta |
| `new_booking`, `partner_*` | `booking_id` | Hamkor → Bronlar |
| `message` | `conversation_id` | Chat |
| `promo` | `venue_id` yoki `url` (`/venue/12`) | Venue / berilgan yo'l |

---

## §4. Venue suratlarini yuklash (taklif)

Hamkor ro'yxatdan o'tganda suratlarni tanlaydi, lekin yuklash API'si yo'q, shuning uchun hozircha ular yuborilmaydi.

```
POST /venue/venues/{id}/photos      multipart/form-data: file (jpeg/webp, ≤ 5 MB), sort_order?
  → 201 VenuePhotoRead
DELETE /venue/venues/{id}/photos/{photo_id} → 204
PATCH  /venue/venues/{id}/photos/order  { photo_ids: number[] } → 200 VenuePhotoRead[]
```

Ilova suratni yuborishdan oldin 1600 px gacha kichraytiradi va siqadi.

---

## §5. Promokod va voucherlar (taklif)

Web'dagi voucherlar ro'yxati hardcode qilingan edi. Native ilovada "Voucherlar" tabi bo'sh holatni ko'rsatadi.

```
GET  /vouchers                → VoucherRead[]   (foydalanuvchiga tegishli faol voucherlar)
POST /vouchers/validate       { code, venue_id, booking_kind } → { valid, discount_percent | discount_amount, message }
```

Bron yaratishda `promo_code?: string` maydoni: `HallEventCreate` va `TableReservationCreate`.

---

## §6. Kichik takliflar (mavjud endpointlarga)

| Joy | Muammo | Taklif |
|---|---|---|
| `GET /venues/search` → `sort` | Qabul qilinadigan qiymatlar hujjatlashtirilmagan. Shuning uchun ilova natijalarni hozircha o'zi saralaydi, bu esa faqat yuklangan sahifaga ishlaydi. | `sort` uchun `recommended` \| `rating` \| `price_asc` \| `distance` qiymatlarini qo'llab-quvvatlash (distance — `latitude`/`longitude` berilganda) |
| `GET /venues/search` → elementlar | Koordinata yo'q. Xarita rejimida ilova har bir venue uchun alohida `GET /venues/{id}` so'raydi (30 tagacha so'rov). | `latitude`, `longitude` (string, `VenueRead` dagi kabi) qo'shish |
| `POST /bookings/hall` | To'yxonada "Tayyor dasturxon" yoki "O'zimiz tayyorlaymiz" tanlovi uchun maydon yo'q. Hozir u `note` ichiga matn sifatida yoziladi. | `service_mode: "ready" \| "own"` maydoni |

---

## §7. Real backend tekshiruvi natijalari (2026-10-23)

Ochiq endpointlar `npm run smoke` sxemalari bilan solishtirildi:

| Endpoint | Natija |
|---|---|
| `/regions`, `/regions/{id}/districts`, `/districts/nearest`, `/amenities`, `/service-catalog`, `/venues/{id}/zones`, `/venues/{id}/reviews`, `/reviews/venue/{id}/aggregate`, `/venues/{id}/availability` | ✓ tiplar mos |
| `/venues/search` | ⚠ yangi maydonlar: `venue_type`, `street`, `house_number`, `capacity_min`, `capacity_max`. Ilova tiplariga qo'shildi, kartalarda manzil va sig'im ko'rsatiladi |
| `/venues/{id}` | ⚠ yangi maydon `guest_tiers`. Bu to'yxonaning mehmonlar soni bo'yicha narx bosqichlari bo'lsa kerak (`BookingRead.guest_tier_id` bilan bog'liq). **Element tuzilishini yuboring** (`id`, `min_guests`, `max_guests`, `price`?) va `HallEventCreate` da `guest_tier_id` kerakmi, shuni ayting. Shunda bron oqimiga tanlov qo'shiladi |
| `/languages` | ✗ **4xx xato.** Ilova bu ro'yxatdan til kodini `language_id` ga aylantiradi. Endpoint ishlamasa, til almashtirilganda profil yangilanmaydi (ilova ishlashda davom etadi). Ochiq (`skipAuth`) bo'lishi kerak |
| `/venues/1/tables?...` | 1-venue (96 o'rinli restoran) uchun bo'sh stollar ro'yxati har doim bo'sh: `19:00` va `19:00:00` formatlarida ham. Stollar kiritilmaganmi yoki filtr xatomi — tekshiring. Stol bo'lmasa mijoz restoranni bron qila olmaydi |
| `/docs`, `/openapi.json` | Yopiq. Test (staging) muhitida ochib qo'yilsa, `types.ts` ni OpenAPI'dan avtomatik generatsiya qilish mumkin bo'ladi va bunday nomuvofiqliklar o'z-o'zidan yo'qoladi |

Token talab qiladigan endpointlar test akkaunti bilan `npm run smoke` orqali tekshiriladi (README → "Backend smoke test").

---

## §8. Akkauntni o'chirish

`DELETE /users/me` mavjud. App Store talabi bo'yicha u:
- refresh tokenlarni va qurilmalarni bekor qilishi;
- shaxsiy ma'lumotlarni (ism, telefon, avatar) anonimlashtirishi;
- faol bronlar bo'yicha qaror qabul qilishi kerak. **Biznes qarori kerak:** bekor qilinadimi yoki saqlanadimi.
