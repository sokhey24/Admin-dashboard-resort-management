import { useQuery } from '@tanstack/react-query';
import { fetchFoodCategories, fetchMenuItems } from '../services/api/diningApi.js';
import { getApiErrorMessage } from '../services/api/errors.js';
import { mapFoodCategoriesList, mapMenuItemsList } from '../util/mapMenuItem.js';

export function useDiningMenu() {
  const categoriesQuery = useQuery({
    queryKey: ['dining', 'food-categories'],
    queryFn: async () => mapFoodCategoriesList(await fetchFoodCategories()),
    retry: 1,
    staleTime: 60_000,
  });

  const menuQuery = useQuery({
    queryKey: ['dining', 'menu-items'],
    queryFn: async () => mapMenuItemsList(await fetchMenuItems()),
    retry: 1,
    staleTime: 60_000,
  });

  const loading = categoriesQuery.isLoading || menuQuery.isLoading;
  const error =
    categoriesQuery.isError || menuQuery.isError
      ? getApiErrorMessage(categoriesQuery.error || menuQuery.error)
      : null;

  return {
    categories: categoriesQuery.data ?? [],
    menuItems: menuQuery.data ?? [],
    loading,
    error,
    reload: () => {
      categoriesQuery.refetch();
      menuQuery.refetch();
    },
  };
}
