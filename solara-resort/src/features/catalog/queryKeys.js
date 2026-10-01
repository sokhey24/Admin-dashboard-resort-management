export const catalogKeys = {
  all: ['catalog'],
  resorts: (params) => ['catalog', 'resorts', params],
  branches: (params) => ['catalog', 'branches', params],
  resort: (id) => ['catalog', 'resort', id],
  branch: (id) => ['catalog', 'branch', id],
  resortRooms: (resortId, params) => ['catalog', 'resort-rooms', resortId, params],
  resortGallery: (resortId) => ['catalog', 'resort-gallery', resortId],
  rooms: (params) => ['catalog', 'rooms', params],
  room: (id) => ['catalog', 'room', id],
  roomTypes: (params) => ['catalog', 'room-types', params],
};
