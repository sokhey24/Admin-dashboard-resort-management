import { useMemo } from 'react';
import { useWebsiteContent } from './useWebsiteContent.js';
import { ACTIVITIES_PREVIEW_ITEMS } from '../data/activitiesPreviewData.js';
import config from '../config/env.js';

/**
 * Activities list: CMS (website-content → activities/items) or preview catalog when frontend-only mode is on.
 */
export function useActivitiesCatalog() {
  const cms = useWebsiteContent();

  const frontendOnly = config.activitiesFrontendOnly;

  const activities = useMemo(() => {
    if (frontendOnly) return ACTIVITIES_PREVIEW_ITEMS;
    return cms.activities;
  }, [frontendOnly, cms.activities]);

  return {
    activities,
    loading: frontendOnly ? false : cms.loading,
    error: frontendOnly ? null : cms.error,
    reload: cms.reload,
    isPreviewCatalog: frontendOnly,
    cmsActivityCount: cms.activities.length,
  };
}
