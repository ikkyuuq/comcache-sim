import React, { useState, useMemo } from "react";

function Pagination({ limit, totalPages, setCurrentPage, currentPage }) {
	const handlePageChange = (newPage) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
		}
	};

	const pageNumbers = useMemo(() => {
		const maxPagesToShow = limit;
		const pages = [];

		let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
		let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

		if (endPage === totalPages) {
			startPage = Math.max(1, totalPages - maxPagesToShow + 1);
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		return pages;
	}, [currentPage, totalPages]);

	const showStartButtons = pageNumbers[0] > 2;
	const showEndButtons = pageNumbers[pageNumbers.length - 1] < totalPages - 1;

	return (
		<div className="flex justify-center items-center my-4 text-sm space-x-2">
			{showStartButtons && (
				<>
					<button
						type="button"
						onClick={() => handlePageChange(1)}
						className="px-4 py-2 bg-gray-200 rounded"
					>
						1
					</button>
					{pageNumbers[0] > 2 && (
						<span className="px-2 text-gray-500">...</span>
					)}
				</>
			)}

			{/* Previous button */}
			<button
				type="button"
				onClick={() => handlePageChange(currentPage - 1)}
				disabled={currentPage === 1}
				className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
			>
				Previous
			</button>

			{/* Page number buttons */}
			{pageNumbers.map((pageNum) => (
				<button
					type="button"
					key={`page-${pageNum}`}
					onClick={() => handlePageChange(pageNum)}
					className={`px-4 py-2 rounded ${
						currentPage === pageNum ? "bg-black text-white" : "bg-gray-200"
					}`}
				>
					{pageNum}
				</button>
			))}

			{/* Next button */}
			<button
				type="button"
				onClick={() => handlePageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
			>
				Next
			</button>

			{/* Last page button */}
			{showEndButtons && (
				<>
					{pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
						<span className="px-2 text-gray-500">...</span>
					)}
					<button
						type="button"
						onClick={() => handlePageChange(totalPages)}
						className="px-4 py-2 bg-gray-200 rounded"
					>
						{totalPages}
					</button>
				</>
			)}
		</div>
	);
}

export default Pagination;
