import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Pagination from "./Pagination";

function CustomTable({
	caches,
	cacheConfig,
	cacheType, // "DIRECT_MAPPED", "SET_ASSOCIATIVE", "FULLY_ASSOCIATIVE"
	cacheResult,
	iconAction,
	actionToIndex,
	action,
	actionWay,
	writePolicy,
}) {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// Handle page change
	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	// Recalculate headers and processedCaches when cacheConfig or cacheType changes
	const headers = React.useMemo(() => {
		const baseHeaders = {
			DIRECT_MAPPED: ["Index", "Valid", "Tag", "Data", "Offset"],
			SET_ASSOCIATIVE: [
				"Set",
				"Way",
				"Valid",
				"Tag",
				"Data",
				"Offset",
				"Last Access",
			],
			FULLY_ASSOCIATIVE: [
				"Way",
				"Valid",
				"Tag",
				"Data",
				"Offset",
				"Last Access",
			],
		}[cacheType];

		if (writePolicy === "WRITE_BACK") {
			const validIndex = baseHeaders.indexOf("Offset");
			return [
				...baseHeaders.slice(0, validIndex + 1),
				"Dirty",
				...baseHeaders.slice(validIndex + 1),
			];
		}
		return baseHeaders;
	}, [cacheType, writePolicy]);

	let processedCaches = React.useMemo(() => {
		if (cacheType === "SET_ASSOCIATIVE") {
			return caches.flatMap((cacheSet) => {
				return Array.from({
					length: cacheConfig.associativity,
				}).map((_, way) => ({
					...cacheSet,
					way,
					tag: cacheSet.ways[way]?.tag || "",
					valid: cacheSet.ways[way]?.valid || false,
					data: cacheSet.ways[way]?.data || "",
					offset: cacheSet.ways[way]?.offset || "",
					lastAccess: cacheSet.ways[way]?.lastAccess || "",
					dirtyBit: cacheSet.ways[way]?.dirtyBit || false,
				}));
			});
		} else if (cacheType === "FULLY_ASSOCIATIVE") {
			return Array.from({ length: cacheConfig.associativity }).map((_, way) => {
				const cache = caches[0].ways[way] || {};
				return {
					...cache,
					way,
					tag: cache.tag || "",
					valid: cache.valid || false,
					data: cache.data || "",
					offset: cache.offset || "",
					lastAccess: cache.lastAccess || "",
					dirtyBit: cache.dirtyBit || false,
				};
			});
		}
		return caches;
	}, [caches, cacheType, cacheConfig]);
	const animatedBackground = {
		hit: {
			backgroundColor: "#ecfdf5",
			color: "#009966",
			transition: { duration: 0.3 },
		},
		miss: {
			backgroundColor: "#fff1f2",
			color: "#ec003f",
			transition: { duration: 0.3 },
		},
		search: {
			backgroundColor: "#ecfeff",
			color: "#0092b8",
			transition: { duration: 0.3 },
		},
		replace: {
			backgroundColor: "#fffbeb",
			color: "#e17100",
			transition: { duration: 0.3 },
		},
	};

	// Dynamically determine headers
	const getHeaders = (cacheType) => {
		const baseHeaders = {
			DIRECT_MAPPED: ["Index", "Valid", "Tag", "Data", "Offset"],
			SET_ASSOCIATIVE: [
				"Set",
				"Way",
				"Valid",
				"Tag",
				"Data",
				"Offset",
				"Last Access",
			],
			FULLY_ASSOCIATIVE: [
				"Way",
				"Valid",
				"Tag",
				"Data",
				"Offset",
				"Last Access",
			],
		}[cacheType];

		if (writePolicy === "WRITE_BACK") {
			const validIndex = baseHeaders.indexOf("Offset");
			return [
				...baseHeaders.slice(0, validIndex + 1),
				"Dirty",
				...baseHeaders.slice(validIndex + 1),
			];
		}
		return baseHeaders;
	};

	// Calculate the current items to display
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const [currentItems, setCurrentItems] = useState(processedCaches);

	useEffect(() => {
		setCurrentItems(processedCaches.slice(indexOfFirstItem, indexOfLastItem));
	}, [indexOfFirstItem, indexOfLastItem, processedCaches]);

	// Calculate total pages
	const totalPages = Math.ceil(processedCaches.length / itemsPerPage);

	return (
		<div className="overflow-x-auto h-full min-w-md rounded-xl shadow bg-white">
			<table className="w-full">
				<thead className="bg-gray-100 text-center">
					<tr>
						{headers.map((header) => (
							<th key={header} className="px-4 py-2">
								{header}
							</th>
						))}
						<th className="px-4 py-2">Action</th>
					</tr>
				</thead>
				<tbody className="text-center">
					{currentItems.map((cache) => {
						let rowAnimation = "bg-white text-black";
						if (cacheType === "FULLY_ASSOCIATIVE") {
							if (actionWay === cache.way) {
								if (action === "SEARCH") rowAnimation = "search";
								else if (cacheResult === "MISS") rowAnimation = "miss";
								else if (cacheResult === "HIT") rowAnimation = "hit";
								else if (cacheResult === "REPLACE") rowAnimation = "replace";
							}
						} else {
							if (actionToIndex === cache.index) {
								if (action === "SEARCH") rowAnimation = "search";
								else if (cacheResult === "MISS") rowAnimation = "miss";
								else if (cacheResult === "HIT") rowAnimation = "hit";
								else if (cacheResult === "REPLACE") rowAnimation = "replace";
							}
						}
						return (
							<motion.tr
								layout
								key={`${cache.index !== undefined ? cache.index : ""}-${
									cache.way
								}`}
								variants={animatedBackground}
								animate={rowAnimation}
								className="border-0 hover:bg-gray-50"
							>
								{headers.includes("Index") && (
									<td className="px-4 py-2">{cache.index}</td>
								)}
								{headers.includes("Set") && (
									<td className="px-4 py-2">{cache.index}</td>
								)}
								{headers.includes("Way") && (
									<td className="px-4 py-2">{cache.way}</td>
								)}
								<td className="px-4 py-2">{cache.valid ? "1" : "0"}</td>
								<td className="px-4 py-2">{cache.tag}</td>
								<td className="px-4 py-2">{cache.data}</td>
								{headers.includes("Offset") && (
									<td className="px-4 py-2">{cache.offset}</td>
								)}
								{headers.includes("Dirty") && (
									<td className="px-4 py-2">{cache.dirtyBit ? "1" : "0"}</td>
								)}
								{headers.includes("Last Access") && (
									<td className="px-4 py-2">{cache.lastAccess}</td>
								)}
								<td className="px-4 py-2">
									<div className="flex justify-center">
										{cacheType === "FULLY_ASSOCIATIVE"
											? actionWay === cache.way
												? iconAction
												: null
											: actionToIndex === cache.index
												? iconAction
												: null}
									</div>
								</td>
							</motion.tr>
						);
					})}
				</tbody>
			</table>
			{totalPages > 1 && (
				<Pagination
					limit={5}
					totalPages={totalPages}
					setCurrentPage={setCurrentPage}
					currentPage={currentPage}
				/>
			)}
		</div>
	);
}

export default CustomTable;
