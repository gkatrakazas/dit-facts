import { useState, useMemo } from "react";

export function usePagination(data, rowsPerPage = 100) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = useMemo(() => Math.ceil(data.length / rowsPerPage), [data, rowsPerPage]);

  const currentData = useMemo(
    () => data.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage),
    [data, currentPage, rowsPerPage]
  );

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));
  const goToPage = (index) => setCurrentPage(Math.max(0, Math.min(index, totalPages - 1)));

  return {
    currentPage,
    totalPages,
    currentData,
    nextPage,
    prevPage,
    goToPage,
    canGoNext: currentPage < totalPages - 1,
    canGoPrev: currentPage > 0,
  };
}
