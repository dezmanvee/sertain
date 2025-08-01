"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
//import useSearchParams from next navigation
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    console.log("Search term:", term);
    //create an instance of serachParams
    const params = new URLSearchParams(searchParams);

    //set the page parameter to 1
    params.set("page", "1");

    //set the query parameter to the search term
    //if term is empty, delete the query parameter

    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }

    //update the URL
    replace(`${pathname}?${params?.toString()}`);
  }, 2000);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("query")?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
