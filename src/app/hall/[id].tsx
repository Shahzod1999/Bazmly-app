import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Deep link mosligi: https://bazmly.uz/hall/12 (web'da /toyxona/12).
 * Bitta venue sahifasi to'yxona va restoranni turiga qarab ko'rsatadi.
 */
export default function HallRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: "/venue/[id]", params: { id } }} />;
}
