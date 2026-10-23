import { router } from "expo-router";
import { isPartner, useAuth } from "../../stores/auth";
import { usePrefs } from "../../stores/prefs";

/**
 * Login'dan keyin qayerga borish:
 *  - `redirect` param bo'lsa — o'sha joyga (masalan, bron qilinayotgan zal)
 *  - hamkor bo'lsa — hamkor paneliga
 *  - aks holda — bosh sahifa
 */
export function finishAuth(redirect?: string | null) {
  if (router.canDismiss()) router.dismissAll();
  if (redirect && redirect.startsWith("/")) {
    router.replace(redirect as never);
    return;
  }
  if (isPartner()) {
    usePrefs.getState().setPartnerAsCustomer(false);
    router.replace("/partner");
    return;
  }
  router.replace("/");
}

/** Mehmon himoyalangan amalni bosganda: login sahifasini ochadi */
export function requireAuth(redirect?: string): boolean {
  if (useAuth.getState().status === "authed") return true;
  router.push({ pathname: "/(auth)/phone", params: redirect ? { redirect } : {} });
  return false;
}
