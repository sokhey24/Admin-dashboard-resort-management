import React, { useEffect, useMemo, useState } from 'react';
import { RoomCard, ROOM_CARD_GRID_PAGE_SIZE } from '../components/room/RoomCard.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { useRoomsList } from '../hooks/useCatalog.js';
import { useApp } from '../context/AppContext.jsx';
import { paginateItems } from '../util/paginateList.js';

const PAGE_SIZE = ROOM_CARD_GRID_PAGE_SIZE;

export function RoomRelated({ room }) {
  const { t } = useApp();
  const roomId = room?.id;
  const resortId = room?.resortId ?? room?.resortSnapshot?.id;
  const [page, setPage] = useState(1);

  const { rooms, loading } = useRoomsList(
    { resort_id: resortId, per_page: 50 },
    { enabled: Boolean(resortId && roomId) }
  );

  const relatedAll = useMemo(() => {
    if (!roomId) return [];
    return rooms.filter((item) => String(item.id) !== String(roomId));
  }, [rooms, roomId]);

  useEffect(() => {
    setPage(1);
  }, [roomId, resortId]);

  const pagination = useMemo(
    () => paginateItems(relatedAll, page, PAGE_SIZE),
    [relatedAll, page]
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  if (!roomId || (!loading && relatedAll.length === 0)) {
    return null;
  }

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-border"
      aria-labelledby="room-related-heading"
    >
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium block mb-1">
          {t('rooms.youMayAlsoLike', 'You May Also Like')}
        </span>
        <h2 id="room-related-heading" className="text-2xl font-serif font-bold text-text">
          {t('rooms.moreAtThisBranch', 'More Accommodations at This Location')}
        </h2>
        <p className="text-xs text-muted mt-1 max-w-xl">
          {t(
            'rooms.moreAtThisBranchSubtitle',
            'Other rooms and suites available for your stay at this sanctuary.'
          )}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t('common.loading', 'Loading…')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch auto-rows-fr">
            {pagination.items.map((item) => (
              <RoomCard key={item.id} room={item} />
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

export default RoomRelated;
