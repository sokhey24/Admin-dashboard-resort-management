import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useRoomDetail } from '../../hooks/useCatalog.js';

const BRANCH_PATH_PATTERNS = [
  /^\/branches\/([^/]+)/i,
  /^\/branch\/([^/]+)/i,
  /^\/locations\/([^/]+)/i,
  /^\/resort\/([^/]+)/i,
];

function matchBranchToken(pathname) {
  for (const pattern of BRANCH_PATH_PATTERNS) {
    const match = pathname.match(pattern);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

function findBranch(branches, token) {
  if (!token || !Array.isArray(branches)) return null;
  const normalized = String(token).toLowerCase();
  return branches.find((branch) => {
    const id = branch?.id ?? branch?.branchId;
    const slug = branch?.slug;
    return (
      (slug && String(slug).toLowerCase() === normalized) ||
      (id != null && String(id) === String(token))
    );
  });
}

/**
 * Resolves the sanctuary context from the current route (branch or room detail).
 */
export function useConciergePageBranch(branches) {
  const { pathname } = useLocation();
  const params = useParams();

  const roomRouteId = pathname.startsWith('/room/') ? params.id : null;
  const { room } = useRoomDetail(roomRouteId);

  return useMemo(() => {
    if (room?.branchId != null) {
      const fromRoom = branches.find(
        (b) => (b.id ?? b.branchId) === room.branchId,
      );
      if (fromRoom) {
        return {
          branchId: fromRoom.id ?? fromRoom.branchId,
          branchName: fromRoom.name ?? '',
        };
      }
      return {
        branchId: room.branchId,
        branchName: room.resortName || room.type || '',
      };
    }

    const token = matchBranchToken(pathname);
    const branch = findBranch(branches, token);
    if (!branch) {
      return { branchId: null, branchName: null };
    }

    return {
      branchId: branch.id ?? branch.branchId ?? null,
      branchName: branch.name ?? null,
    };
  }, [branches, pathname, room]);
}
