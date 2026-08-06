import { MdDelete } from 'react-icons/md';
import { Button } from 'antd';
function ButtonDelete({ dark, onClick }) {
  return (
    <Button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
        dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"
      }`}>
      <MdDelete size={14} /> Delete
    </Button>
  );
}

export default ButtonDelete;
