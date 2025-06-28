import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

const PaginationControls = ({
  currentPage,
  totalPages,
  goToPage,
  nextPage,
  prevPage,
  canGoPrev,
  canGoNext,
}) => {
  const getPageNumbers = () => {
    const maxDisplayed = 5;
    const pages = [];

    if (totalPages <= maxDisplayed) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);

    if (start > 0) pages.push(0, '...');
    else pages.push(...Array.from({ length: start + 1 }, (_, i) => i));

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (end < totalPages - 1) pages.push('...', totalPages - 1);

    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <button
        onClick={prevPage}
        disabled={!canGoPrev}
        className="flex items-center gap-1 px-2 py-1 border rounded disabled:opacity-30"
      >
        <FaAngleLeft className="w-4 h-4" />
        Προηγούμενη
      </button>

      <div className="flex items-center gap-1 mx-2">
        {getPageNumbers().map((page, i) =>
          page === "..." ? (
            <span key={i} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={i}
              onClick={() => goToPage(page)}
              className={`px-2 py-1 border rounded ${page === currentPage
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
                }`}
            >
              {page + 1}
            </button>
          )
        )}
      </div>

      <button
        onClick={nextPage}
        disabled={!canGoNext}
        className="flex items-center gap-1 px-2 py-1 border rounded disabled:opacity-30"
      >
        Επόμενη
        <FaAngleRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PaginationControls;