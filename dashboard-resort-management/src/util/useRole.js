import { ProfileStore } from "../store/ProfileStore";

export const ROLES = {
  ADMIN:             "admin",
  RESORT:            "resort_manager",
  RESTAURANT:        "restaurant_manager",
  RESORT_STAFF:      "resort_staff",
  RESTAURANT_STAFF:  "restaurant_staff",
  CUSTOMER:          "customer",
};

export default function useRole() {
  const { profile, roles } = ProfileStore();

  // Primary role: prefer roles[] from API, fall back to profile.roles[0]
  const role = roles?.[0] ?? profile?.roles?.[0]?.name ?? null;

  return {
    role,
    roles: roles ?? [],
    isAdmin:           role === ROLES.ADMIN,
    isResort:          role === ROLES.RESORT,
    isRestaurant:      role === ROLES.RESTAURANT,
    isResortStaff:     role === ROLES.RESORT_STAFF,
    isRestaurantStaff: role === ROLES.RESTAURANT_STAFF,
    hasRole: (r) => (roles ?? []).includes(r),
  };
}
