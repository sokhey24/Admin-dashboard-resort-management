import { ProfileStore } from "../store/ProfileStore";

export const ROLES = {
  ADMIN:      "admin",
  RESORT:     "resort_manager",
  RESTAURANT: "restaurant_manager",
};

export default function useRole() {
  const { profile } = ProfileStore();
  const role = profile?.roles?.[0]?.name || ROLES.ADMIN;
  return {
    role,
    isAdmin:      role === ROLES.ADMIN,
    isResort:     role === ROLES.RESORT,
    isRestaurant: role === ROLES.RESTAURANT,
  };
}
