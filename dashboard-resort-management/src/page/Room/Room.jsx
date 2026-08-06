import { useState } from 'react';
import RoomCard, { ROOM_TYPES } from './RoomCard.jsx';
import RoomFeature from './RoomFeature.jsx';
import { useDarkMode } from '../../util/DarkModeContext';

function Room() {
  const dark = useDarkMode();
  const [selectedRoom, setSelectedRoom] = useState(ROOM_TYPES[0]);

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <h2 className={`text-xl font-bold mb-5 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Room Management</h2>
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0">
          <RoomCard selectedId={selectedRoom?.id} onSelect={setSelectedRoom} />
        </div>
        <div className="xl:w-80 shrink-0 sticky top-4">
          <RoomFeature room={selectedRoom} onClose={() => setSelectedRoom(ROOM_TYPES[0])} />
        </div>
      </div>
    </div>
  );
}

export default Room;
