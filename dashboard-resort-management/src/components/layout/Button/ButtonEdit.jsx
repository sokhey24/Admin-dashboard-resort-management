import { MdEdit } from 'react-icons/md';
import { Button } from 'antd';
function ButtonEdit({ dark, onClick }) {
  return (
    <Button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
        dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-[#FFF3E8] text-[#FF6B00] hover:bg-orange-100"
      }`}>
      <MdEdit size={14} /> Edit
    </Button>
  );
}

export default ButtonEdit;
