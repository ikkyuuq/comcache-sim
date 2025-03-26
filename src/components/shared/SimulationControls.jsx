import { motion } from "framer-motion";
import React from "react";

export default function SimulationControls({
	disabled,
	onReset,
	onPrevious,
	onNext,
	onFastForward,
}) {
	return (
		<div className="space-x-2">
			{disabled ? (
				<span className="text-red-400">
					Please configure your cache and provide addresses before continuing...
				</span>
			) : (
				""
			)}
			<motion.button
				disabled={disabled}
				onClick={onReset}
				className={`text-sm text-white px-4 py-2 rounded-lg font-bold ${disabled ? "bg-gray-400" : "bg-red-400"}`}
			>
				Reset
			</motion.button>
			<motion.button
				disabled={disabled}
				onClick={onPrevious}
				className={`text-sm px-4 py-2 rounded-lg font-bold ${disabled ? "bg-gray-400 text-white" : "bg-white text-black"}`}
			>
				Previous
			</motion.button>
			<motion.button
				disabled={disabled}
				onClick={onNext}
				className={`text-sm px-4 py-2 rounded-lg font-bold ${disabled ? "bg-gray-400 text-white" : "bg-white text-black"}`}
			>
				Next
			</motion.button>
			<motion.button
				disabled={disabled}
				onClick={onFastForward}
				className={`text-sm text-white px-4 py-2 rounded-lg font-bold ${disabled ? "bg-gray-400" : "bg-green-400"}`}
			>
				Fast Forward
			</motion.button>
		</div>
	);
}
