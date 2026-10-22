import { create } from "zustand";
import {
  authService,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  onAuthLogout,
  otpService,
  userService,
  type OtpVerifyResult,
  type UserProfileUpdate,
  type UserRead,
  type UserRole,
} from "../api";
import { loadTokens } from "../api/tokens";

export const PARTNER_ROLES: UserRole[] = ["partner", "venue_owner", "venue_staff", "staff", "admin"];

export type AuthStatus = "booting" | "guest" | "authed";

interface AuthState {
  status: AuthStatus;
  user: UserRead | null;
  /** Mock OTP rejimida yangi foydalanuvchi: ism kiritilgach /auth/register chaqiriladi */
  pendingRegistrationPhone: string | null;

  bootstrap: () => Promise<void>;
  refreshUser: () => Promise<UserRead | null>;
  verifyOtp: (requestId: string, phone: string, code: string) => Promise<"done" | "needs_profile">;
  completeProfile: (firstName: string, lastName: string) => Promise<void>;
  loginStaff: (login: string, password: string) => Promise<void>;
  updateProfile: (data: UserProfileUpdate) => Promise<UserRead>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  /** Tashqi sabab bilan sessiya tugaganda (refresh xatosi) */
  forceGuest: () => void;
}

export const useAuth = create<AuthState>()((set, get) => ({
  status: "booting",
  user: null,
  pendingRegistrationPhone: null,

  async bootstrap() {
    await loadTokens();
    if (!getAccessToken()) {
      set({ status: "guest", user: null });
      return;
    }
    // Profil yuklanmasa ham (internet yo'q) tokenni saqlab, guest emas, authed holatda qolamiz —
    // keyingi so'rovlar o'zi qayta urinadi. Faqat 401/403 da sessiya tozalanadi.
    try {
      const user = await userService.getMe();
      set({ status: "authed", user });
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        clearTokens();
        set({ status: "guest", user: null });
      } else {
        set({ status: "authed" });
      }
    }
  },

  async refreshUser() {
    if (!getAccessToken()) return null;
    try {
      const user = await userService.getMe();
      set({ user, status: "authed" });
      return user;
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) get().forceGuest();
      return null;
    }
  },

  async verifyOtp(requestId, phone, code) {
    const res: OtpVerifyResult = await otpService.verify(requestId, phone, code);
    if (res.kind === "new_user_pending") {
      set({ pendingRegistrationPhone: res.phone });
      return "needs_profile";
    }
    const user = await userService.getMe();
    set({ user, status: "authed", pendingRegistrationPhone: null });
    if (!res.profile_completed || user.status === "pending_profile" || !user.first_name)
      return "needs_profile";
    return "done";
  },

  async completeProfile(firstName, lastName) {
    const pendingPhone = get().pendingRegistrationPhone;
    if (pendingPhone) {
      await authService.register({ phone: pendingPhone, first_name: firstName, last_name: lastName });
    } else {
      await authService.completeProfile({ first_name: firstName, last_name: lastName });
    }
    const user = await userService.getMe();
    set({ user, status: "authed", pendingRegistrationPhone: null });
  },

  async loginStaff(login, password) {
    await authService.loginStaff({ login, password });
    const user = await userService.getMe();
    set({ user, status: "authed" });
  },

  async updateProfile(data) {
    const user = await userService.updateMe(data);
    set({ user });
    return user;
  },

  async logout() {
    const rt = getRefreshToken();
    try {
      if (rt) await authService.logout(rt);
    } catch {
      /* server xatosi bo'lsa ham lokal chiqamiz */
    }
    clearTokens();
    set({ status: "guest", user: null, pendingRegistrationPhone: null });
  },

  async deleteAccount() {
    await userService.deleteMe();
    clearTokens();
    set({ status: "guest", user: null });
  },

  forceGuest() {
    clearTokens();
    set({ status: "guest", user: null });
  },
}));

// refresh muvaffaqiyatsiz bo'lsa — mehmon holatiga o'tamiz
onAuthLogout(() => useAuth.getState().forceGuest());

export function isPartnerRole(role: UserRole | undefined | null): boolean {
  return !!role && PARTNER_ROLES.includes(role);
}

export function useIsAuthed() {
  return useAuth((s) => s.status === "authed");
}
