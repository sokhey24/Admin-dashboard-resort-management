import React, { useEffect, useMemo, useState } from 'react';
import { BranchCard } from '../components/branch/BranchCard.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { useBranches } from '../hooks/useCatalog.js';
import { useApp } from '../context/AppContext.jsx';
import { paginateItems } from '../util/paginateList.js';

const PAGE_SIZE = 6;

export function BranchRelated({ branch }) {
  const { t } = useApp();
  const branchId = branch?.id;
  const [page, setPage] = useState(1);

  const { branches, loading } = useBranches({ per_page: 50 }, { enabled: Boolean(branchId) });

  const relatedAll = useMemo(() => {
    if (!branchId) return [];
    return branches.filter((item) => String(item.id) !== String(branchId));
  }, [branches, branchId]);

  useEffect(() => {
    setPage(1);
  }, [branchId]);

  const pagination = useMemo(
    () => paginateItems(relatedAll, page, PAGE_SIZE),
    [relatedAll, page]
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  if (!branchId || (!loading && relatedAll.length === 0)) {
    return null;
  }

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-border"
      aria-labelledby="branch-related-heading"
    >
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-1">
          {t('resorts.exploreMore', 'Explore More')}
        </span>
        <h2 id="branch-related-heading" className="text-2xl font-serif font-bold text-text">
          {t('resorts.otherLocations', 'Other Solara Locations')}
        </h2>
        <p className="text-xs text-muted mt-1 max-w-xl">
          {t(
            'resorts.otherLocationsSubtitle',
            'Discover additional sanctuaries across our collection.'
          )}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t('common.loading', 'Loading…')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch auto-rows-fr">
            {pagination.items.map((item) => (
              <BranchCard key={item.id} branch={item} featured={false} />
            ))}
          </div>
          {pagination.showPagination && (
            <Pagination
              className="pt-8"
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </section>
  );
}

export default BranchRelated;
