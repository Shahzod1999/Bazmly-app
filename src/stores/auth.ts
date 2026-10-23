import { create } from "zustand";
import {
  authService,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  onAuthLogout,
  partnerService,
  userService,
  type PhoneRegister,
  type UserProfileUpdate,
  type UserRead,
  type UserRole,
} from "../api";
import { loadTokens } from "../api/tokens";

export const PARTNER_ROLES: UserRole[] = ["venue_owner", "venue_staff", "admin"];

export type AuthStatus = "booting" | "guest" | "authed";

interface AuthState {
  status: AuthStatus;
  user: UserRead | null;
  /**
   * Foydalanuvchi biror muassasada ishlaydimi yoki tarmoq egasimi (`GET /venue/staff/me/workplaces`).
   * Backend huquqlarni `users.role` dan emas, `venue_staff` dan o'qiydi: muassasa yaratgan
   * mijozning roli `customer` bo'lib qoladi, lekin u egasi. Shu sababli panelga kirish shunga qaraydi.
   */
  hasWorkplace: boolean;
  /** Ish joylarini backend'dan yangilaydi */
  checkPartnerAccess: () => Promise<boolean>;
  bootstrap: () => Promise<void>;
  refreshUser: () => Promise<UserRead | null>;
  /**
   * Telefon bilan kirish (backend: SMS/OTP yo'q — DECISIONS.md Part 9).
   * Parol faqat akkauntda o'rnatilgan bo'lsa kerak (`phone-check` → `password_required`).
   */
  loginPhone: (phone: string, password?: string | null) => Promise<"done" | "needs_profile">;
  /** Yangi raqam: ism-familiya va ixtiyoriy parol bilan ro'yxatdan o'tish */
  register: (data: PhoneRegister) => Promise<void>;
  /** Google orqali kelgan, ismi yo'q akkaunt (`pending_profile`) uchun */
  completeProfile: (firstName: string, lastName: string) => Promise<void>;
  /** Parol o'rnatish/o'zgartirish. Backend barcha sessiyalarni bekor qiladi — shu sababli qayta kiramiz */
  setPassword: (newPassword: string, currentPassword?: string | null) => Promise<void>;
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
  hasWorkplace: false,

  async checkPartnerAccess() {
    try {
      const places = await partnerService.getMyWorkplaces();
      set({ hasWorkplace: places.length > 0 });
    } catch {
      // Internet yo'q yoki server xatosi — oldingi holat saqlanadi
    }
    return get().hasWorkplace;
  },

  async bootstrap() {
    await loadTokens();
    if (!getAccessToken()) {
      set({ status: "guest", user: null, hasWorkplace: false });
      return;
    }
    // Profil yuklanmasa ham (internet yo'q) tokenni saqlab, guest emas, authed holatda qolamiz —
    // keyingi so'rovlar o'zi qayta urinadi. Faqat 401/403 da sessiya tozalanadi.
    try {
      const user = await userService.getMe();
      await get().checkPartnerAccess();
      set({ status: "authed", user });
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        clearTokens();
        set({ status: "guest", user: null, hasWorkplace: false });
      } else {
        set({ status: "authed" });
      }
    }
  },

  async refreshUser() {
    if (!getAccessToken()) return null;
    try {
      const user = await userService.getMe();
      await get().checkPartnerAccess();
      set({ user, status: "authed" });
      return user;
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) get().forceGuest();
      return null;
    }
  },

  async loginPhone(phone, password) {
    const tokens = await authService.login({ phone, password: password || null });
    const user = await userService.getMe();
    await get().checkPartnerAccess();
    set({ user, status: "authed" });
    if (tokens.profile_completed === false || user.status === "pending_profile" || !user.first_name)
      return "needs_profile";
    return "done";
  },

  async register(data) {
    await authService.register({ ...data, password: data.password || null });
    const user = await userService.getMe();
    set({ user, status: "authed" });
  },

  async completeProfile(firstName, lastName) {
    await authService.completeProfile({ first_name: firstName, last_name: lastName });
    const user = await userService.getMe();
    set({ user, status: "authed" });
  },

  async setPassword(newPassword, currentPassword) {
    const phone = get().user?.phone;
    await authService.setPassword({ new_password: newPassword, current_password: currentPassword || null });
    // Backend parol o'rnatilganda barcha sessiyalarni bekor qiladi — yangi parol bilan qayta kiramiz
    if (phone) await authService.login({ phone, password: newPassword });
    await get().refreshUser();
  },

  async loginStaff(login, password) {
    await authService.loginStaff({ login, password });
    const user = await userService.getMe();
    await get().checkPartnerAccess();
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
    set({ status: "guest", user: null, hasWorkplace: false });
  },

  async deleteAccount() {
    await userService.deleteMe();
    clearTokens();
    set({ status: "guest", user: null, hasWorkplace: false });
  },

  forceGuest() {
    clearTokens();
    set({ status: "guest", user: null, hasWorkplace: false });
  },
}));

// refresh muvaffaqiyatsiz bo'lsa — mehmon holatiga o'tamiz
onAuthLogout(() => useAuth.getState().forceGuest());

export function isPartnerRole(role: UserRole | undefined | null): boolean {
  return !!role && PARTNER_ROLES.includes(role);
}

/** Hamkor paneli ochilsinmi: hamkor roli yoki ish joyi bor (backend `venue_staff` asosida) */
export function isPartner(state: Pick<AuthState, "user" | "hasWorkplace"> = useAuth.getState()): boolean {
  return isPartnerRole(state.user?.role) || state.hasWorkplace;
}

export function useIsPartner(): boolean {
  return useAuth((s) => isPartnerRole(s.user?.role) || s.hasWorkplace);
}

export function useIsAuthed() {
  return useAuth((s) => s.status === "authed");
}
