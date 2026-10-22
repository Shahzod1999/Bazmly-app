/**
 * Backend venue rasmi (cover_url / photos) bo'lmasa ishlatiladigan zaxira rasmlar.
 * Bu "mock ma'lumot" emas — faqat rasm yo'q holat uchun neytral fon.
 */
const HALL_FALLBACKS = [
  require("../../../assets/images/home/tuyxona1.jpg"),
  require("../../../assets/images/home/tuyxona2.jpg"),
  require("../../../assets/images/home/tuyxona3.jpg"),
  require("../../../assets/images/home/tuyxona4.jpg"),
  require("../../../assets/images/home/top.jpg"),
];
const RESTAURANT_FALLBACKS = [
  require("../../../assets/images/home/rest1.jpg"),
  require("../../../assets/images/home/rest2.jpg"),
  require("../../../assets/images/home/rest3.jpg"),
  require("../../../assets/images/home/rest4.jpg"),
  require("../../../assets/images/home/rest5.jpg"),
  require("../../../assets/images/home/rest6.jpg"),
];

export const FOOD_FALLBACKS = [
  require("../../../assets/images/home/food1.jpg"),
  require("../../../assets/images/home/food2.jpg"),
  require("../../../assets/images/home/food3.jpg"),
  require("../../../assets/images/home/food4.jpg"),
];

export const PROMO_BANNERS = [
  require("../../../assets/images/home/adv1.jpg"),
  require("../../../assets/images/home/top.jpg"),
  require("../../../assets/images/home/tuyxona2.jpg"),
  require("../../../assets/images/home/tuyxona3.jpg"),
];

export function venueImage(
  id: number,
  coverUrl?: string | null,
  type?: string | null,
): number | { uri: string } {
  if (coverUrl) return { uri: coverUrl };
  const list = type === "restoran" ? RESTAURANT_FALLBACKS : HALL_FALLBACKS;
  return list[Math.abs(id) % list.length];
}

export function foodImage(id: number, url?: string | null): number | { uri: string } {
  if (url) return { uri: url };
  return FOOD_FALLBACKS[Math.abs(id) % FOOD_FALLBACKS.length];
}
