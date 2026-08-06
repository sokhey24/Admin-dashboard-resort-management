import React, { useState , useMemo} from 'react'
import { IoSearch } from "react-icons/io5";
import {
  MdEdit, MdDelete, MdSearch, MdUnfoldMore, MdKeyboardArrowUp,
  MdKeyboardArrowDown, MdClose, MdAdd, MdLocationOn,
} from "react-icons/md";

function SearchBar() {

    const [search , setSearch] = useState("");

    // const filtered = useMemo(() => {
    //     const q = search.toLowerCase();
    //     return branches
    //       .filter(b => (status === "all" || b.status === status) &&
    //         (!q || b.name?.toLowerCase().includes(q) || b.location?.toLowerCase().includes(q) || b.manager?.toLowerCase().includes(q)))
    //       .sort((a, b) => {
    //         const av = a[sortCol] ?? "", bv = b[sortCol] ?? "";
    //         const cmp = String(av).localeCompare(String(bv));
    //         return sortDir === "asc" ? cmp : -cmp;
    //       });
    //   }, [ search, status]);
  return (
    <div>
       {/* Search */}
        <div className="relative">
            <MdSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-lg ' />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search…" className={IoSearch} />
         </div>
    </div>
  )
}

export default SearchBar
