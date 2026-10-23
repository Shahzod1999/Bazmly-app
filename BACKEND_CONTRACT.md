# Backend bilan integratsiya

Ilova **Patriotic20/bazmly-backend** (FastAPI) ga ulangan. Railway production shu repo'dan deploy qilinadi. Monorepo `Patriotic20/bazfind` ning `main` branchi eskirgan (2026-08). Haqiqiy kod `bazmly-backend` da: monorepo'ning `frontend-from-rar` branchidan sinxronlanadi.

## Tiplar backend'dan generatsiya qilinadi

`src/api/types.ts` qo'lda yozilmaydi. U backend'ning OpenAPI sxemasidan generatsiya qilinadi:

```bash
npm run api:types                                                                    # repo'dagi api/openapi.json dan
npm run api:types -- https://bazmly-backend-production.up.railway.app/api/openapi.json  # ishlab turgan serverdan
npm run api:types -- http://localhost:8000/api/openapi.json                             # lokal backend'dan
```

Server ishlamasa, sxemani backend kodidan olish mumkin (`bazmly-backend` papkasida):

```bash
uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))" > openapi.json
npm run api:types -- openapi.json
```

Manba URL yoki fayl berilsa, sxema `api/openapi.json` ga ham saqlanadi. Shunda backend'dagi har bir o'zgarish git diff'da ko'rinadi. Keyin `npx tsc --noEmit` ilovaning qaysi joyi yangi sxemaga mos kelmayotganini ko'rsatadi.

Swagger: `/api/docs`. Mijoz ilovasi uchun alohida hujjat `/api/docs/app` da, boshqaruv paneli uchun `/api/docs/admin` da.

## Backend qarorlari va ilovadagi aksi

| Qaror (`DECISIONS.md`) | Ilovada |
|---|---|
| **Part 9: SMS/OTP yo'q, telefon bilan kirish.** Parol ixtiyoriy; o'rnatilgan bo'lsa, kirishda talab qilinadi | Telefon → `POST /auth/phone-check`. Natijaga qarab parol ekrani (`password_required`), to'g'ridan-to'g'ri kirish yoki ro'yxatdan o'tish (ism, familiya va ixtiyoriy parol). Ro'yxatdan o'tish va Profil → Parol ekranlarida parol qo'yish tavsiya qilinadi, sababi tushuntiriladi |
| **Part 9: parol o'rnatilganda barcha sessiyalar bekor qilinadi** | Parol saqlangach ilova yangi parol bilan avtomatik qayta kiradi |
| **Part 10: onlayn to'lov va promokodlar yo'q** | Karta saqlash ham, depozit to'lash ham yo'q. Bron `pending` holatida yaratiladi. Backend hisoblagan depozit miqdori ko'rsatiladi va onlayn to'lanmasligi aytiladi |
| Interfeys tili backend'da saqlanmaydi (`/languages`, `language_id` olib tashlangan) | Til faqat qurilmada saqlanadi |
| To'yxona narxi mehmonlar soniga qarab bosqichdan olinadi (`guest_tiers`) | Bron oqimida bosqichlar va narxlar ko'rsatiladi, mehmonlar soni shu oraliqlarda cheklanadi. Bosqich bo'lmasa onlayn bron yopiq (backend baribir `capacity_exceeded` qaytaradi) |
| Google orqali kirish (`DECISIONS.md` Part 9 da tilga olingan) | `bazmly-backend` da bunday endpoint yo'q, shuning uchun ilovada ham yo'q. Qo'shilsa, ilovaga Google client ID'lari bilan ulanadi |

## Backend uchun ochiq masalalar

### 0. Xodim o'z ish joyini aniqlay olmaydi (muhim)

`GET /venue/groups/me` faqat tarmoq **egasi** uchun ishlaydi. Menejer, ofitsiant va boshqa xodimlar (`bzmana201` va h.k.) uchun u `404 "Sizda hali tarmoq yo'q"` qaytaradi. Boshqa barcha `/venue/...` endpointlari esa `venue_id` yoki `group_id` talab qiladi. Natijada xodim ilovaga kiradi, lekin qaysi filialda ishlashini bilib bo'lmaydi va bronlar, check-in hamda stollar unga yopiq. Ilova hozir xodimga "Ish joyingiz hali ulanmagan" deb ko'rsatadi. Kerak:

```
GET /venue/staff/me/workplaces → [{ venue_id, venue_name, group_id, role: StaffRoleRead, permissions: string[] }]
```

Endpoint qo'shilgach, ilova xodimni o'sha filial paneliga olib kiradi. Panel bo'limlari `permissions` ga qarab ko'rsatiladi: ofitsiantga faqat check-in va stollar.

### 1. Push haqiqatda yuborilmaydi (muhim)

`app/core/transports.py` da standart `LoggingPushSender` faqat log yozadi. Ilova `POST /users/me/devices` ga **Expo push token** (`ExponentPushToken[...]`) yuboradi. Uni yetkazish uchun sender quyidagicha bo'lishi mumkin:

```python
class ExpoPushSender:
    URL = "https://exp.host/--/api/v2/push/send"

    async def send(self, tokens: list[str], title: str, body: str, data: dict | None = None) -> None:
        messages = [{"to": t, "title": title, "body": body, "data": data or {}, "sound": "default",
                     "channelId": "bookings"} for t in tokens if t.startswith("ExponentPushToken")]
        if not messages:
            return
        async with httpx.AsyncClient(timeout=10) as client:
            for i in range(0, len(messages), 100):  # Expo: bir so'rovda 100 tagacha
                await client.post(self.URL, json=messages[i:i + 100])

# lifespan'da: set_push_sender(ExpoPushSender())
```

Push'da `data` ham bo'lishi kerak, shunda bildirishnoma bosilganda ilova kerakli ekranni ochadi:

| `data.type` | Maydonlar | Ilova ochadigan ekran |
|---|---|---|
| `booking_confirmed`, `booking_rejected`, `booking_reminder` | `booking_id` | Chipta |
| `new_booking` (hamkorga) | `booking_id` | Hamkor → Bronlar |
| `message` | `conversation_id` | Chat |

FCM/APNs bilan to'g'ridan-to'g'ri ishlash tanlansa, ilovada `EXPO_PUBLIC_PUSH_TOKEN_KIND=native` qo'yiladi va native token yuboriladi.

### 2. Bron javobida `venue_name` bo'sh (xato)

`POST /bookings/table`, `POST /bookings/hall` va `GET /bookings/{id}` `venue_name: ""` qaytaradi: `booking_service.py` da `_detail_in_transaction(..., venue_name=None)` chaqiriladi va `venue_name or ""` bo'lib qoladi. Ilova vaqtincha nomni `GET /venues/{id}` dan oladi (`useBookingVenueName`). Tuzatish: venue nomini o'qib uzatish (`venue.name` create'da allaqachon bor).

### 3. Hamkor to'yxona narx bosqichlarini kirita olmaydi

`venue_guest_tiers` faqat seed orqali to'ldiriladi. Hamkor uchun bosqich yaratish yoki tahrirlash endpointi yo'q (`/venue/venues/{id}/guest-tiers`). Bosqichsiz to'yxonani esa bron qilib bo'lmaydi (`capacity_exceeded`). Real muassasalar ulanishidan oldin kerak:

```
GET    /venue/venues/{id}/guest-tiers                → VenueGuestTierRead[]
PUT    /venue/venues/{id}/guest-tiers                [{ min_guests, max_guests|null, base_price }] → VenueGuestTierRead[]
```

Bosqichlar ustma-ust tushmasligi kerak (hozir seed'da 150–200 va 200–300 chegarada kesishadi). Endpoint tayyor bo'lgach, hamkor sozlamalariga tahrirlash ekrani qo'shiladi.

### 4. Depozit qanday to'lanadi?

Backend depozitni hisoblaydi (`deposit_amount`, narx qatori `deposit`). `deposit_paid_at` ham bor, lekin uni belgilaydigan endpoint yo'q. Mijozga hozir "to'lov tartibini muassasa kelishadi" deb aytilyapti. Agar muassasa depozitni olganini panelda belgilashi kerak bo'lsa (masalan, `POST /venue/bookings/{id}/deposit-received`), hamkor ilovasiga tugma qo'shiladi.

### 5. Venue suratlarini yuklash

`PATCH /venue/venues/{id}/onboarding/media-done` bor, lekin suratni yuklaydigan endpoint yo'q. Shu sababli hamkor ro'yxatdan o'tishda tanlagan suratlar yuborilmaydi. Taklif:

```
POST   /venue/venues/{id}/photos          multipart: file (jpeg/webp ≤ 5 MB) → 201 VenuePhotoRead
DELETE /venue/venues/{id}/photos/{photo_id} → 204
```

### 6. Qidiruv natijasida koordinata

`VenueListItem` da `latitude` / `longitude` yo'q. Xarita rejimida ilova har bir venue uchun alohida `GET /venues/{id}` so'raydi (30 tagacha so'rov). Ikkala maydonni (`VenueRead` dagi kabi string) qo'shish bu so'rovlarni keraksiz qiladi.

### 7. To'yxonada xizmat turi

"Tayyor dasturxon" yoki "O'zimiz tayyorlaymiz" tanlovi uchun `HallEventCreate` da maydon yo'q, hozir u `note` ichiga matn bo'lib yoziladi. Taklif: `service_mode: "ready" | "own"`.

### 8. Production ma'lumotlari

- 1-venue ("Bahor Chilonzor", 96 o'rin) uchun `GET /venues/1/tables` har doim bo'sh qaytadi. Stollar kiritilmagan bo'lsa, mijoz uni bron qila olmaydi.
- To'yxonalarda `guest_tiers` bo'lmasa, onlayn bron yopiq bo'ladi.

### 9. Mijoz bronga sharh qoldirganini bilib bo'lmaydi

`BookingListItem` da `has_review` maydoni ham, "mening sharhlarim" endpointi ham yo'q. Ilova sharh qoldirilgan bronlarni qurilmada eslab qoladi va `409 already_reviewed` kelsa ham shunday belgilaydi. Boshqa qurilmada esa "Sharh yozish" tugmasi qayta chiqadi. Taklif: `BookingListItem.has_review: bool`.

### 10. Chat: muassasa javob bera olmaydi (reliz oldidan muhim)

Mijoz `POST /conversations` va `POST /conversations/{id}/messages` orqali yozadi. Lekin muassasa tomoni uchun router yo'q: `ConversationService.list_for_venue` bor, ammo hech qaysi endpoint uni chaqirmaydi va `sender_type=venue` bilan xabar yuborib bo'lmaydi. Natijada mijoz xabari hech kimga yetib bormaydi. Kerak:

```
GET  /venue/conversations?venue_id=          → ConversationListItem[] (mijoz ismi bilan)
GET  /venue/conversations/{id}/messages      → MessageRead[]
POST /venue/conversations/{id}/messages      { body } → MessageRead  (sender_type=venue)
POST /venue/conversations/{id}/read
```

Shuningdek `ConversationListItem` da `venue_name` yo'q: ilova nomni har bir suhbat uchun `GET /venues/{id}` dan oladi. Endpointlar qo'shilgach, hamkor paneliga "Xabarlar" bo'limi qo'shiladi. Ilovadagi "Ma'muriyat onlayn" yozuvi olib tashlandi, chunki u haqiqatga mos emas edi.

### 11. Do'st qo'shib bo'lmaydi

`POST /users/me/friends` `addressee_id` (foydalanuvchi ID) talab qiladi, lekin foydalanuvchini telefon yoki ism bo'yicha topadigan endpoint yo'q. Shuning uchun ilovada do'stlar ro'yxati va kelgan so'rovlarni qabul qilish bor, ammo so'rov yuborish yo'q. Taklif: `POST /users/me/friends { phone }` yoki `GET /users/lookup?phone=`.

### 12. Yangi tarmoq `draft` holatida qoladi

Ro'yxatdan o'tish ustasi oxirida filial `active` bo'ladi va qidiruvda ko'rinadi, tarmoq (`venue_groups.status`) esa `draft` bo'lib qoladi. Uni faqat admin o'zgartiradi. Agar bu moderatsiya bosqichi bo'lsa, qidiruv ham tarmoq holatini tekshirishi kerak. Aks holda tekshirilmagan muassasa darhol mijozlarga ko'rinadi.

## Lokal backend bilan tekshirilgan (2026-10-23)

`bazmly-backend` (barcha migratsiyalar va `scripts.seed_demo`) lokal Postgres/PostGIS'da ishga tushirilib, ilova unga ulangan holda sinaldi. Mock ishlatilmagan.

- `npm run smoke`: mijoz 37/37, muassasa egasi 52/52 endpoint. Avval `GET /venue/analytics/revenue` xato berdi: ilova noto'g'ri parametr (`period` → `current_from/…`) va noto'g'ri javob tipi (`PeriodComparisonRead`) ishlatardi. Tuzatildi.
- Xodim akkaunti (`bzmana201`) bilan: kirish ishlaydi, `/venue/groups/me` → 404 (§0).
- E2E (brauzer): ro'yxatdan o'tgan mijoz parol bilan kiradi → to'yxona → narx bosqichi → bron (UI narxi backend bilan bir xil) → muassasa egasi panelda tasdiqlaydi → QR orqali check-in (`checked_in`). Restoranda stol broni ham o'tdi.
- Hamkor paneli (E2E): bronni rad etish, check-out, kategoriya va taom qo'shish, xodim taklifi, muassasa profili va ish vaqtini saqlash. Yangi hamkorning ro'yxatdan o'tishi: tarmoq, filial, 8 ta stol, onboarding bosqichlari → filial `active`, qidiruvda ko'rinadi, ilova panelga o'tkazadi.
- Mijoz (E2E): sharh qoldirish, bronni bekor qilish, sevimlilar, muassasaga xabar yozish, xabarlar ro'yxati, do'stlar va bildirishnomalar ekranlari.
- Shu sinovda topilib, ilovada tuzatilgan xatolar:
  - `/venue/bookings` filtri: ilova `status` yuborardi, backend esa `statuses` (ro'yxat) kutadi, shuning uchun filtr jimgina ishlamasdi;
  - dashboard'da `venue_id` yo'q edi (422);
  - narx bosqichi chegarada (200 kishi) ilovada boshqa bosqich tanlanardi, mijozga backend'dagidan boshqa narx ko'rsatilardi;
  - to'yxona kalendarida yopiq hafta kunlari tanlanardi (backend `venue_closed` qaytaradi);
  - `queue_count` (bugun keladigan, tasdiqlangan mehmonlar) "Kutilayotgan bronlar" deb ko'rsatilardi;
  - yangi ro'yxatdan o'tgan hamkor panelga kira olmasdi: backend uning `role` ini `customer` qoldiradi. Endi huquq tarmoq egaligidan ham aniqlanadi (`GET /venue/groups/me` → 200);
  - ro'yxatdan o'tishda stollar yaratilmasdi va onboarding yakunlanmasdi, filial `draft` bo'lib qolardi va qidiruvda ko'rinmasdi;
  - xodim taklifida "Egasi" roli tanlanardi (birinchi rol standart edi), ya'ni tasodifan begona odamga egalik huquqi berilishi mumkin edi;
  - tarmoq darajasidagi xodimlar ro'yxatda ikki marta chiqardi;
  - sharh qoldirilgan bronda "Sharh yozish" tugmasi qolardi va qayta yuborilganda 409 xato chiqardi;
  - xabarlar ro'yxatida muassasa nomi o'rniga "Muassasa #2" ko'rsatilardi;
  - bronni bekor qilish oynasida ikkala tugma ham "Bekor qilish" deb yozilgan edi.

## Tekshirish

`npm run smoke` endpointlarni chaqiradi va har bir javobni `types.ts` ga solishtiradi. Batafsil: README → "Backend smoke test".
