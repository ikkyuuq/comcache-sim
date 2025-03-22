import { motion } from "framer-motion";
import React from "react";

export default function SimulationControls({
	onReset,
	onPrevious,
	onNext,
	onFastForward,
}) {
	return (
		<div className="space-x-2">
			<motion.button
				onClick={onReset}
				className="text-sm text-white px-4 py-2 bg-red-400 rounded-lg font-bold"
			>
				Reset
			</motion.button>
			<motion.button
				onClick={onPrevious}
				className="text-sm px-4 py-2 bg-white rounded-lg font-bold"
			>
				Previous
			</motion.button>
			<motion.button
				onClick={onNext}
				className="text-sm px-4 py-2 bg-white rounded-lg font-bold"
			>
				Next
			</motion.button>
			<motion.button
				onClick={onFastForward}
				className="text-sm text-white px-4 py-2 bg-green-400 rounded-lg font-bold"
			>
				Fast Forward
			</motion.button>
		</div>
	);
}
