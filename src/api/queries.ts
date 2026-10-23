import { QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookingService,
  catalogService,
  engagementService,
  geoService,
  orderService,
  partnerService,
  userService,
  venueService,
  BazmlyApiError,
  type HallEventCreate,
  type TableReservationCreate,
  type VenueSearchParams,
  type ReviewCreate,
  type VenueUpdate,
  type WorkingHoursCreate,
  type StaffInvitationCreate,
  type MenuItemCreate,
  type VenueGroupWithBranchCreate,
  type BookingStatus,
} from "./index";
import { useIsAuthed } from "../stores/auth";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => {
        // 4xx xatolarni qayta urinmaymiz
        if (error instanceof BazmlyApiError && error.status >= 400 && error.status < 500) return false;
        return count < 2;
      },
    },
    mutations: { retry: false },
  },
});

export const qk = {
  me: ["me"] as const,
  venues: (p: VenueSearchParams) => ["venues", p] as const,
  venue: (id: number) => ["venue", id] as const,
  availability: (id: number, from: string, to: string) => ["availability", id, from, to] as const,
  freeTables: (id: number, date: string, s: string, e: string, seats: number) =>
    ["freeTables", id, date, s, e, seats] as const,
  zones: (id: number) => ["zones", id] as const,
  menu: (id: number) => ["menu", id] as const,
  services: (id: number, groupId: number) => ["services", id, groupId] as const,
  reviews: (id: number) => ["reviews", id] as const,
  reviewAgg: (id: number) => ["reviewAgg", id] as const,
  myBookings: ["myBookings"] as const,
  booking: (id: number) => ["booking", id] as const,
  favorites: ["favorites"] as const,
  notifications: ["notifications"] as const,
  unread: ["unread"] as const,
  conversations: ["conversations"] as const,
  venueConversations: (venueId?: number) => ["venue-conversations", venueId] as const,
  venueMessages: (id: number) => ["venue-messages", id] as const,
  workplaces: ["workplaces"] as const,
  messages: (id: number) => ["messages", id] as const,
  regions: ["regions"] as const,
  districts: (regionId: number) => ["districts", regionId] as const,
  recentLocations: ["recentLocations"] as const,
  friends: ["friends"] as const,
  friendRequests: ["friendRequests"] as const,
  amenities: ["amenities"] as const,
  // partner
  myGroup: ["partner", "group"] as const,
  myVenues: (groupId?: number) => ["partner", "venues", groupId] as const,
  dashboard: (groupId?: number, venueId?: number) => ["partner", "dashboard", groupId, venueId] as const,
  venueBookings: (venueId?: number, status?: string, date?: string) =>
    ["partner", "bookings", venueId, status, date] as const,
  tableBoard: (venueId: number) => ["partner", "tableBoard", venueId] as const,
  categories: (groupId?: number) => ["partner", "categories", groupId] as const,
  menuItems: (groupId?: number, catId?: number) => ["partner", "menuItems", groupId, catId] as const,
  staff: (groupId?: number) => ["partner", "staff", groupId] as const,
  staffCounts: (groupId?: number) => ["partner", "staffCounts", groupId] as const,
  staffRoles: ["partner", "staffRoles"] as const,
  partnerVenue: (id: number) => ["partner", "venue", id] as const,
};

// ---------------- Mijoz ----------------

export function useVenueSearch(params: VenueSearchParams) {
  return useInfiniteQuery({
    queryKey: qk.venues(params),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => venueService.searchVenues({ limit: 20, ...params, offset: pageParam }),
    getNextPageParam: (last) => {
      const next = last.offset + last.limit;
      return next < last.total ? next : undefined;
    },
  });
}

export function useVenue(id: number) {
  return useQuery({
    queryKey: qk.venue(id),
    queryFn: () => venueService.getVenueDetail(id),
    enabled: id > 0,
  });
}

export function useAvailability(id: number, from: string, to: string) {
  return useQuery({
    queryKey: qk.availability(id, from, to),
    queryFn: () => venueService.getAvailability(id, from, to),
    enabled: id > 0,
  });
}

export function useFreeTables(id: number, date: string | null, start: string, end: string, seats: number) {
  return useQuery({
    queryKey: qk.freeTables(id, date ?? "", start, end, seats),
    queryFn: () => venueService.getFreeTables(id, date!, start, end, seats),
    enabled: id > 0 && !!date,
  });
}

export function useZones(id: number) {
  return useQuery({ queryKey: qk.zones(id), queryFn: () => venueService.getZones(id), enabled: id > 0 });
}

export function useVenueMenu(id: number) {
  return useQuery({ queryKey: qk.menu(id), queryFn: () => venueService.getMenu(id), enabled: id > 0 });
}

export function useVenueServices(id: number, groupId: number | undefined) {
  return useQuery({
    queryKey: qk.services(id, groupId ?? 0),
    queryFn: () => venueService.getServices(id, groupId!),
    enabled: id > 0 && !!groupId,
  });
}

export function useReviews(id: number) {
  return useQuery({
    queryKey: qk.reviews(id),
    queryFn: () => venueService.getReviews(id, 10, 0),
    enabled: id > 0,
  });
}

export function useReviewAggregate(id: number) {
  return useQuery({
    queryKey: qk.reviewAgg(id),
    queryFn: () => venueService.getReviewAggregate(id),
    enabled: id > 0,
  });
}

export function useMyBookings() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.myBookings,
    queryFn: () => bookingService.getMyBookings(),
    enabled: authed,
  });
}

export function useBooking(id: number) {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.booking(id),
    queryFn: () => bookingService.getBookingDetail(id),
    enabled: authed && id > 0,
  });
}

export function useBookHall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HallEventCreate) => bookingService.bookHall(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myBookings }),
  });
}

export function useBookTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TableReservationCreate) => bookingService.bookTable(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myBookings }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => bookingService.cancelBooking(id, reason),
    onSuccess: (_, v) => {
      void qc.invalidateQueries({ queryKey: qk.myBookings });
      void qc.invalidateQueries({ queryKey: qk.booking(v.id) });
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewCreate) => venueService.createReview(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useFavorites() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.favorites,
    queryFn: () => engagementService.getFavorites(),
    enabled: authed,
  });
}

export function useFavoriteIds(): Set<number> {
  const { data } = useFavorites();
  return new Set(
    (data ?? [])
      .map((f) => (f as unknown as { venue_id?: number }).venue_id ?? f.venue?.id)
      .filter(Boolean) as number[],
  );
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (venueId: number) => engagementService.toggleFavorite(venueId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.favorites }),
  });
}

export function useNotifications() {
  const authed = useIsAuthed();
  return useInfiniteQuery({
    queryKey: qk.notifications,
    enabled: authed,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => engagementService.getNotifications(20, pageParam),
    getNextPageParam: (last) => {
      const next = last.offset + last.limit;
      return next < last.total ? next : undefined;
    },
  });
}

export function useUnreadCount() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.unread,
    enabled: authed,
    queryFn: () => engagementService.getUnreadNotificationsCount(),
    refetchInterval: 60_000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => engagementService.markAllNotificationsRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notifications });
      void qc.invalidateQueries({ queryKey: qk.unread });
    },
  });
}

export function useConversations() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.conversations,
    queryFn: () => engagementService.getConversations(),
    enabled: authed,
  });
}

export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: qk.messages(conversationId),
    queryFn: () => engagementService.getMessages(conversationId),
    enabled: conversationId > 0,
    refetchInterval: 10_000,
  });
}

export function useSendMessage(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => engagementService.sendMessage(conversationId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: qk.conversations });
    },
  });
}

export function useRegions() {
  return useQuery({ queryKey: qk.regions, queryFn: () => geoService.getRegions(), staleTime: 3_600_000 });
}

export function useDistricts(regionId: number | null) {
  return useQuery({
    queryKey: qk.districts(regionId ?? 0),
    queryFn: () => geoService.getDistricts(regionId!),
    enabled: !!regionId,
    staleTime: 3_600_000,
  });
}

export function useRecentLocations() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.recentLocations,
    queryFn: () => userService.listRecentLocations(),
    enabled: authed,
  });
}


export function useAmenities() {
  return useQuery({
    queryKey: qk.amenities,
    queryFn: () => catalogService.getAmenities(),
    staleTime: 86_400_000,
  });
}



export function useFriends() {
  const authed = useIsAuthed();
  return useQuery({ queryKey: qk.friends, queryFn: () => userService.listFriends(), enabled: authed });
}

export function useFriendRequests() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.friendRequests,
    queryFn: () => userService.listFriendRequests(),
    enabled: authed,
  });
}

export function useRespondFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: number; accept: boolean }) =>
      userService.respondFriendRequest(id, accept),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.friends });
      void qc.invalidateQueries({ queryKey: qk.friendRequests });
    },
  });
}

// ---------------- Hamkor ----------------

export function useMyWorkplaces() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.workplaces,
    queryFn: () => partnerService.getMyWorkplaces(),
    enabled: authed,
    staleTime: 60_000,
  });
}

export function useVenueConversations(venueId?: number) {
  return useQuery({
    queryKey: qk.venueConversations(venueId),
    queryFn: () => engagementService.getVenueConversations(venueId!),
    enabled: !!venueId,
    refetchInterval: 30_000,
  });
}

export function useVenueMessages(conversationId: number, venueId?: number) {
  return useQuery({
    queryKey: qk.venueMessages(conversationId),
    queryFn: () => engagementService.getVenueMessages(conversationId, venueId!),
    enabled: conversationId > 0 && !!venueId,
    refetchInterval: 10_000,
  });
}

export function useSendVenueMessage(conversationId: number, venueId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => engagementService.sendVenueMessage(conversationId, venueId!, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.venueMessages(conversationId) });
      void qc.invalidateQueries({ queryKey: ["venue-conversations"] });
    },
  });
}

export function useMyGroup() {
  const authed = useIsAuthed();
  return useQuery({ queryKey: qk.myGroup, queryFn: () => partnerService.getMyGroup(), enabled: authed });
}

export function useMyVenues(groupId?: number) {
  return useQuery({
    queryKey: qk.myVenues(groupId),
    queryFn: () => partnerService.listVenues(groupId),
    enabled: !!groupId,
  });
}

export function useDashboard(groupId?: number, venueId?: number) {
  return useQuery({
    queryKey: qk.dashboard(groupId, venueId),
    queryFn: () => partnerService.getDashboardAnalytics(groupId!, venueId!),
    // Backend group_id va venue_id ikkalasini talab qiladi (aks holda 422)
    enabled: !!groupId && !!venueId,
  });
}

export function useVenueBookings(venueId?: number, status?: BookingStatus, date?: string) {
  return useQuery({
    queryKey: qk.venueBookings(venueId, status, date),
    queryFn: () => orderService.getVenueBookings(venueId!, date, status),
    enabled: !!venueId,
  });
}

export function useTableBoard(venueId?: number) {
  return useQuery({
    queryKey: qk.tableBoard(venueId ?? 0),
    queryFn: () => orderService.getTableBoard(venueId!),
    enabled: !!venueId,
  });
}

function invalidatePartnerBookings(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: ["partner", "bookings"] });
  void qc.invalidateQueries({ queryKey: ["partner", "dashboard"] });
  void qc.invalidateQueries({ queryKey: ["partner", "tableBoard"] });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, venueId }: { id: number; venueId: number }) =>
      orderService.confirmBooking(id, venueId),
    onSuccess: () => invalidatePartnerBookings(qc),
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, venueId, reason }: { id: number; venueId: number; reason?: string }) =>
      orderService.rejectBooking(id, reason, venueId),
    onSuccess: () => invalidatePartnerBookings(qc),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qrToken, venueId }: { qrToken: string; venueId: number }) =>
      orderService.checkInBooking({ qr_token: qrToken, venue_id: venueId }),
    onSuccess: () => invalidatePartnerBookings(qc),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, venueId }: { id: number; venueId: number }) =>
      orderService.checkOutBooking(id, venueId),
    onSuccess: () => invalidatePartnerBookings(qc),
  });
}

export function useCategories(groupId?: number) {
  return useQuery({
    queryKey: qk.categories(groupId),
    queryFn: () => partnerService.listCategories(groupId!),
    enabled: !!groupId,
  });
}

export function useMenuItems(venueId?: number, categoryId?: number) {
  return useQuery({
    queryKey: qk.menuItems(venueId, categoryId),
    queryFn: () => partnerService.listMenuItems(venueId!, categoryId),
    enabled: !!venueId,
  });
}

export function useCreateCategory(groupId?: number, venueId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => partnerService.createCategory({ name }, groupId!, venueId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner", "categories"] }),
  });
}

export function useCreateMenuItem(venueId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MenuItemCreate) => partnerService.createMenuItem({ payload }, venueId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner", "menuItems"] });
      void qc.invalidateQueries({ queryKey: ["partner", "categories"] });
    },
  });
}

export function useStaff(groupId?: number) {
  return useQuery({
    queryKey: qk.staff(groupId),
    queryFn: () => partnerService.listStaff(groupId!),
    enabled: !!groupId,
  });
}

export function useStaffCounts(groupId?: number) {
  return useQuery({
    queryKey: qk.staffCounts(groupId),
    queryFn: () => partnerService.getStaffCounts(groupId!),
    enabled: !!groupId,
  });
}

export function useStaffRoles() {
  return useQuery({ queryKey: qk.staffRoles, queryFn: () => partnerService.listStaffRoles() });
}

export function useInviteStaff(groupId?: number, venueId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffInvitationCreate) => partnerService.inviteStaff(groupId!, data, venueId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner", "staff"] });
      void qc.invalidateQueries({ queryKey: ["partner", "staffCounts"] });
    },
  });
}

export function useSetStaffActive(venueId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, active }: { staffId: number; active: boolean }) =>
      partnerService.setStaffActive(staffId, venueId!, active),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner", "staff"] });
      void qc.invalidateQueries({ queryKey: ["partner", "staffCounts"] });
    },
  });
}

export function usePartnerVenue(id?: number) {
  return useQuery({
    queryKey: qk.partnerVenue(id ?? 0),
    queryFn: () => partnerService.getVenue(id!),
    enabled: !!id,
  });
}

export function useUpdateVenue(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VenueUpdate) => partnerService.updateVenue(id!, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner"] });
      void qc.invalidateQueries({ queryKey: qk.venue(id ?? 0) });
    },
  });
}

export function useUpdateWorkingHours(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (days: WorkingHoursCreate[]) => partnerService.updateWorkingHours(id!, { days }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner"] });
      void qc.invalidateQueries({ queryKey: qk.venue(id ?? 0) });
    },
  });
}

export function useCreateGroupWithBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VenueGroupWithBranchCreate) => partnerService.createGroupWithBranch(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner"] }),
  });
}
