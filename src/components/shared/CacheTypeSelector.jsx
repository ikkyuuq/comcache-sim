import { motion } from "framer-motion";
import React from "react";

const CacheTypes = Object.freeze({
	DIRECT_MAPPED: "DIRECT_MAPPED",
	SET_ASSOCIATIVE: "SET_ASSOCIATIVE",
	FULLY_ASSOCIATIVE: "FULLY_ASSOCIATIVE",
});

const animatedButton = {
	active: {
		backgroundColor: "#99CDED",
		color: "#fff",
	},
	inactive: {
		backgroundColor: "#fff",
		color: "#000",
	},
};

export default function CacheTypeSelector({ mode, onChange }) {
	return (
		<div className="flex gap-2">
			{Object.values(CacheTypes).map((type) => (
				<motion.button
					key={type}
					animate={mode === type ? "active" : "inactive"}
					variants={animatedButton}
					onClick={() => onChange(type)}
					className="text-sm px-4 py-2 rounded-lg font-bold"
				>
					{type.replace("_", " ")}
				</motion.button>
			))}
		</div>
	);
}
