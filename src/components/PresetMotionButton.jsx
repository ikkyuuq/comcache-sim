import { motion } from "framer-motion";
import PropTypes from "prop-types";
import React from "react";

function PresetMotionButton({
	title,
	isActive,
	onClick,
	className = "rounded-lg p-3 text-gray-500 border-gray-500 border-solid border cursor-pointer hover:bg-gray-50",
	children,
}) {
	const animatedButton = {
		active: {
			backgroundColor: "#1a1a1a",
			color: "#fff",
			border: "none",
		},
		inactive: {
			backgroundColor: "#fff",
			border: "1px solid",
		},
	};
	return (
		<motion.button
			animate={isActive ? "active" : "inactive"}
			variants={animatedButton}
			onClick={onClick}
			className={className}
		>
			{children || title}
		</motion.button>
	);
}

PresetMotionButton.propTypes = {
	title: PropTypes.string,
	isActive: PropTypes.bool,
	animatedButton: PropTypes.object,
	onClick: PropTypes.func.isRequired,
	className: PropTypes.string,
	children: PropTypes.node,
};

export default PresetMotionButton;
