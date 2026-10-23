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

### 2. Depozit qanday to'lanadi?

Backend depozitni hisoblaydi (`deposit_amount`, narx qatori `deposit`). `deposit_paid_at` ham bor, lekin uni belgilaydigan endpoint yo'q. Mijozga hozir "to'lov tartibini muassasa kelishadi" deb aytilyapti. Agar muassasa depozitni olganini panelda belgilashi kerak bo'lsa (masalan, `POST /venue/bookings/{id}/deposit-received`), hamkor ilovasiga tugma qo'shiladi.

### 3. Venue suratlarini yuklash

`PATCH /venue/venues/{id}/onboarding/media-done` bor, lekin suratni yuklaydigan endpoint yo'q. Shu sababli hamkor ro'yxatdan o'tishda tanlagan suratlar yuborilmaydi. Taklif:

```
POST   /venue/venues/{id}/photos          multipart: file (jpeg/webp ≤ 5 MB) → 201 VenuePhotoRead
DELETE /venue/venues/{id}/photos/{photo_id} → 204
```

### 4. Qidiruv natijasida koordinata

`VenueListItem` da `latitude` / `longitude` yo'q. Xarita rejimida ilova har bir venue uchun alohida `GET /venues/{id}` so'raydi (30 tagacha so'rov). Ikkala maydonni (`VenueRead` dagi kabi string) qo'shish bu so'rovlarni keraksiz qiladi.

### 5. To'yxonada xizmat turi

"Tayyor dasturxon" yoki "O'zimiz tayyorlaymiz" tanlovi uchun `HallEventCreate` da maydon yo'q, hozir u `note` ichiga matn bo'lib yoziladi. Taklif: `service_mode: "ready" | "own"`.

### 6. Production ma'lumotlari

- 1-venue ("Bahor Chilonzor", 96 o'rin) uchun `GET /venues/1/tables` har doim bo'sh qaytadi. Stollar kiritilmagan bo'lsa, mijoz uni bron qila olmaydi.
- To'yxonalarda `guest_tiers` bo'lmasa, onlayn bron yopiq bo'ladi.

## Tekshirish

`npm run smoke` endpointlarni chaqiradi va har bir javobni `types.ts` ga solishtiradi. Batafsil: README → "Backend smoke test".
