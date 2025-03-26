import { motion } from "framer-motion";
import React from "react";

function CacheBlock({
	index,
	selected,
	setSelected,
	actionToIndex,
	action,
	contains,
	cacheType,
}) {
	const animatedWidth = {
		selected: {
			width: cacheType === "SET_ASSOCIATIVE" ? 120 : 64 * 2 + 10,
			transition: {
				duration: 0.3,
			},
		},
		unselected: {
			width: cacheType === "SET_ASSOCIATIVE" ? 80 : 64,
			transition: {
				duration: 0.5,
			},
		},
	};

	const animatedInnerBackground = {
		hit: {
			backgroundColor: "#66D458",
			color: "#fff",
			transition: {
				duration: 0.3,
			},
		},
		miss: {
			backgroundColor: "#FF5353",
			color: "#fff",
			transition: {
				duration: 0.3,
			},
		},
		contains: {
			backgroundColor: "#99CDED",
			color: "#fff",
			transition: {
				duration: 0.3,
			},
		},
	};

	const prefix = {
		DIRECT_MAPPED: "i",
		SET_ASSOCIATIVE: "s",
		FULLY_ASSOCIATIVE: "w",
	};

	const selectedPrefix = prefix[cacheType] || prefix.DIRECT_MAPPED;

	return (
		<motion.div
			layout
			animate={
				selected === index || actionToIndex === index
					? "selected"
					: "unselected"
			}
			transition={{ duration: 0.3, ease: "easeInOut" }}
			variants={animatedWidth}
			onTap={() => setSelected(index)}
			whileTap={{
				scale: 0.9,
				boxShadow: "0 0 0 rgba(0, 0, 0,0.1)",
			}}
			className="p-2 w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-white"
		>
			<motion.div
				animate={
					action === "HIT" && actionToIndex === index
						? "hit"
						: action === "MISS" && actionToIndex === index
							? "miss"
							: contains
								? "contains"
								: "unselected"
				}
				layout
				variants={animatedInnerBackground}
				style={{ userSelect: "none" }}
				className="font-bold w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"
			>
				{cacheType === "SET_ASSOCIATIVE" ? (
					<div className="flex flex-col items-center">
						<span>
							{selectedPrefix}
							{index}
						</span>
					</div>
				) : (
					<>
						{selectedPrefix}
						{index}
					</>
				)}
			</motion.div>
		</motion.div>
	);
}

export default CacheBlock;
