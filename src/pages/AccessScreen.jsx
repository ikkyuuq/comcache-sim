import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip,
} from "chart.js";
import { motion } from "framer-motion";
import React from "react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
	FiCheck,
	FiEye,
	FiMessageCircle,
	FiPlus,
	FiRepeat,
	FiSliders,
	FiX,
} from "react-icons/fi";
import CacheBlock from "../components/CacheBlock";
import CustomTable from "../components/CustomTable";
import CacheTypeSelector from "../components/shared/CacheTypeSelector";
import SimulationControls from "../components/shared/SimulationControls";
import useSimStore from "../hooks/store";
import ModalConfig from "../components/ModalConfig";

function AccessScreen() {
	const CacheTypes = Object.freeze({
		DIRECT_MAPPED: "DIRECT_MAPPED",
		SET_ASSOCIATIVE: "SET_ASSOCIATIVE",
		FULLY_ASSOCIATIVE: "FULLY_ASSOCIATIVE",
	});
	const {
		cacheConfig,
		caches,
		getSteps,
		simState,
		messageLog,
		currentStep,
		nextStep,
		previousStep,
		resetSim,
		initializeCaches,
		setAccessAddress,
		action,
		actionToIndex,
		cacheResult,
		countCacheResult,
		setMode,
		setCurrentStep,
		setWritePolicy,
		clearCompleted,
		mode,
		performanceMetrics,
		performanceMetricsHistory,
	} = useSimStore();

	const {
		hitRate,
		missRate,
		avgAccessTime,
		readStallCycle,
		writeStallCycle,
		writeMissPenalty,
		writeBufferStall,
		cpuTime,
		memoryWrites,
		energyConsumption,
	} = performanceMetrics;

	const { hit, miss } = countCacheResult;
	const [hitCount, setHitCount] = useState(hit);
	const [missCount, setMissCount] = useState(miss);

	const [addresses, setAddresses] = useState([]);

	ChartJS.register(
		CategoryScale,
		LinearScale,
		LineElement,
		PointElement,
		Tooltip,
		Legend,
	);

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			y: {
				min: 0,
				max: 1,
				ticks: {
					callback: (value) => `${(value * 100).toFixed(0)}%`,
				},
			},
		},
	};
	const data = {
		labels: addresses.map((_, i) => i + 1),
		datasets: [
			{
				label: "Hit Rate",
				data: performanceMetricsHistory.map((metric) => metric.hitRate),
				fill: false,
				borderColor: "#10B981",
				tension: 0.1,
			},
			{
				label: "Miss Rate",
				data: performanceMetricsHistory.map((metric) => metric.missRate),
				fill: false,
				borderColor: "#EF4444",
				tension: 0.1,
			},
		],
	};

	useEffect(() => {
		setHitCount(hit);
		setMissCount(miss);
	}, [hit, miss]);

	const [selectedBlock, setSelectedBlock] = useState(null);

	const [currentAddressIndex, setCurrentAddressIndex] = useState(addresses[0]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		resetSim();
		initializeCaches();
		setAccessAddress(addresses[0]);
		setCurrentAddressIndex(0);
	}, [resetSim, initializeCaches, setAccessAddress]);

	const handleReset = () => {
		resetSim();
		initializeCaches();
		setAccessAddress(addresses[0]);
		setCurrentAddressIndex(0);
	};

	const steps = getSteps();
	const handleFastForward = () => {
		for (let i = 0; i < addresses.length - 1; i++) {
			nextStep();
		}

		if (currentAddressIndex < addresses.length - 1) {
			const nextIndex = currentAddressIndex + 1;
			setCurrentAddressIndex(nextIndex);
			setAccessAddress(addresses[nextIndex]);
			setCurrentStep(0);
			clearCompleted();
		}
	};

	const handlePreviousStep = () => {
		previousStep();
	};

	const handleNextStep = () => {
		if (currentStep >= steps.length) {
			if (currentAddressIndex < addresses.length - 1) {
				const nextIndex = currentAddressIndex + 1;
				setCurrentAddressIndex(nextIndex);
				setAccessAddress(addresses[nextIndex]);

				setCurrentStep(0);
				clearCompleted();
			}
		} else {
			nextStep();
		}
	};

	const [modalConfigurationOpen, setModalConfigurationOpen] = useState(false);
	const [showAddressInput, setShowAddressInput] = useState(false);
	const [addressInput, setAddressInput] = useState("");

	const [isMessageLogOpen, setIsMessageLogOpen] = useState(true);
	const [isCacheBlocksOpen, setIsCacheBlocksOpen] = useState(true);
	const [isTableOpen, setIsTableOpen] = useState(true);
	const [isPerformanceOpen, setIsPerformanceOpen] = useState(true);

	const handleOpenModal = () => {
		setModalConfigurationOpen(true);
	};

	const handleChangeCacheType = (mode) => {
		setMode(mode);
		handleReset();
	};

	return (
		<>
			{showAddressInput && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-4 rounded-lg w-96">
						<h2 className="text-lg font-bold mb-2">Enter Addresses</h2>
						<input
							type="text"
							placeholder="e.g., 22, 34, 22, 0, 1"
							className="w-full p-2 border rounded mb-2"
							value={addressInput}
							onChange={(e) => setAddressInput(e.target.value)}
						/>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								className="px-4 py-1 bg-gray-200 rounded-lg"
								onClick={() => setShowAddressInput(false)}
							>
								Cancel
							</button>
							<button
								type="button"
								className="px-4 py-1 bg-blue-500 text-white rounded-lg"
								onClick={() => {
									const numbers = addressInput
										.split(",")
										.map((num) => Number.parseInt(num.trim(), 10));
									const binaryAddresses = numbers.map((num) =>
										num.toString(2).padStart(cacheConfig.bitAddress, "0"),
									);
									setAddresses(binaryAddresses);
									setShowAddressInput(false);

									handleReset();
								}}
							>
								Apply
							</button>
						</div>
					</div>
				</div>
			)}
			<header className="flex justify-between items-center">
				<div className="flex items-center gap-2">
					<ModalConfig
						cacheConfig={cacheConfig}
						CacheTypes={CacheTypes}
						modalConfigurationOpen={modalConfigurationOpen}
						setModalConfigurationOpen={setModalConfigurationOpen}
					/>
					<div className="flex gap-2 items-center">
						<FiSliders className="text-2xl" />
						<h1 className="text-2xl font-bold">Cache Access View</h1>
					</div>
					<button
						type="button"
						className="px-4 py-1 rounded-lg bg-white hover:bg-gray-50 "
						onClick={handleOpenModal}
					>
						Configure
					</button>
					<button
						type="button"
						className="px-4 py-1 rounded-lg bg-white hover:bg-gray-50 "
						onClick={() => setShowAddressInput(!showAddressInput)}
					>
						Add Addresses
					</button>
					<span>{addressInput}</span>
				</div>
				<div className="flex gap-2">
					<CacheTypeSelector mode={mode} onChange={handleChangeCacheType} />

					<motion.button
						onClick={() =>
							// TODO : Change the actually write policy in cache config
							setWritePolicy(
								cacheConfig.writePolicy === "WRITE_BACK"
									? "WRITE_THROUGH"
									: "WRITE_BACK",
							)
						}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className={`text-sm px-4 py-2 rounded-lg font-bold ${
							cacheConfig.writePolicy === "WRITE_BACK"
								? "bg-black text-white"
								: "bg-gray-200 text-black"
						}`}
					>
						{cacheConfig.writePolicy === "WRITE_BACK"
							? "Write Back"
							: "Write Through"}
					</motion.button>
				</div>
			</header>
			<div className="w-fit text-sm flex items-center gap-2 bg-white px-4 py-1 rounded-full">
				<div className="flex items-center gap-1">
					<FiCheck className="text-green-500" />
					<div>Hit : {hitCount}</div>
				</div>
				<div className="flex items-center gap-1">
					<FiX className="text-red-500" />
					<div>Miss : {missCount}</div>
				</div>
			</div>
			<div className="flex flex-col justify-between ">
				<main className="mt-4 flex gap-4 flex-1">
					<div className="flex flex-col w-full">
						<div className="flex flex-row justify-between items-center mb-3">
							<h3 className="text-sm font-medium text-gray-500 mb-3">
								Cache Blocks
							</h3>
							<SimulationControls
								onReset={handleReset}
								onPrevious={handlePreviousStep}
								onNext={handleNextStep}
								onFastForward={handleFastForward}
							/>
						</div>
						<div className="flex flex-col lg:flex-row w-full gap-4">
							<div className="flex flex-col w-full max-w-6xl gap-4">
								{/* Cache Blocks */}
								<div className="flex flex-1 flex-col gap-2 w-full">
									<button
										type="button"
										onClick={() => setIsCacheBlocksOpen(!isCacheBlocksOpen)}
										className="flex items-center gap-2 p-2 bg-white rounded-t-lg hover:bg-gray-50"
									>
										<FiMessageCircle className="text-xl" />
										<span className="font-bold">Cache Blocks</span>
										{isCacheBlocksOpen ? <FiX /> : <FiEye />}
									</button>
									{isCacheBlocksOpen && (
										<div className="flex-wrap flex flex-col flex-1 gap-2">
											<motion.div
												layout
												transition={{ duration: 0.3, ease: "easeInOut" }}
												className="flex flex-row gap-2 flex-wrap overflow-x-auto"
											>
												{caches.map((block) => {
													return (
														<CacheBlock
															key={block.index}
															index={block.index}
															selected={selectedBlock}
															actionToIndex={actionToIndex}
															setSelected={() => setSelectedBlock(block.index)}
															action={cacheResult}
															cacheType={mode}
															contains={caches.find((b) =>
																mode === CacheTypes.FULLY_ASSOCIATIVE
																	? b.index === block.index &&
																		b.ways.some((w) => w.valid)
																	: mode === CacheTypes.SET_ASSOCIATIVE
																		? b.index === block.index &&
																			b.ways.find((w) => w.valid)
																		: b.index === block.index && b.valid,
															)}
														/>
													);
												})}
											</motion.div>
										</div>
									)}
								</div>
								{/* Table Simulation */}
								<div className="flex flex-col gap-2 w-full flex-1 min-w-64 ">
									<button
										type="button"
										onClick={() => setIsTableOpen(!isTableOpen)}
										className="flex items-center gap-2 p-2 bg-white rounded-t-lg hover:bg-gray-50"
									>
										<FiMessageCircle className="text-xl" />
										<span className="font-bold">Table Simulation</span>
										{isTableOpen ? <FiX /> : <FiEye />}
									</button>
									{isTableOpen && (
										<div className="flex-1">
											<CustomTable
												caches={caches}
												cacheConfig={cacheConfig}
												cacheType={mode}
												cacheResult={cacheResult}
												associativity={cacheConfig.associativity}
												actionToIndex={actionToIndex}
												action={action}
												actionWay={simState.way}
												writePolicy={cacheConfig.writePolicy}
												iconAction={
													action === "SEARCH" ? (
														<FiEye />
													) : action === "WRITE" ? (
														<FiPlus />
													) : action === "REPLACE" ? (
														<FiRepeat />
													) : null
												}
											/>
										</div>
									)}
								</div>
							</div>

							{/* Cache Performance Overview */}
							<div className="flex flex-col gap-2 w-full lg:max-w-xl flex-1 h-fit">
								<button
									type="button"
									onClick={() => setIsPerformanceOpen(!isPerformanceOpen)}
									className="flex items-center gap-2 p-2 bg-white rounded-t-lg hover:bg-gray-50"
								>
									<FiMessageCircle className="text-xl" />
									<span className="font-bold">Performances</span>
									{isPerformanceOpen ? <FiX /> : <FiEye />}
								</button>
								{isPerformanceOpen && (
									<div className="bg-white h-fit flex-1 rounded-lg shadow-sm border border-gray-100 p-4 overflow-x-auto">
										<div>
											<Line data={data} options={options} />
										</div>
										{/* Hit/Miss Rate Cards */}
										<div className="flex gap-4 mb-6">
											<div className="flex-1 bg-emerald-50 rounded-lg p-4 border border-emerald-100">
												<div className="text-3xl font-semibold text-emerald-600 mb-1">
													{Number.parseFloat(hitRate * 100).toFixed(4)}%
												</div>
												<div className="text-xs font-medium text-emerald-500">
													Hit Rate
												</div>
											</div>

											<div className="flex-1 bg-rose-50 rounded-lg p-4 border border-rose-100">
												<div className="text-3xl font-semibold text-rose-600 mb-1">
													{Number.parseFloat(missRate * 100).toFixed(4)}%
												</div>
												<div className="text-xs font-medium text-rose-500">
													Miss Rate
												</div>
											</div>
										</div>

										{/* AMAT Card */}
										<div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
											<div className="text-2xl font-semibold text-gray-700 mb-1">
												{Number.parseFloat(avgAccessTime).toFixed(4)}
											</div>
											<div className="text-sm text-gray-500">
												Average Access Memory Time (AMAT)
											</div>
										</div>

										{/* Stall Cycles */}
										<div className="flex gap-4 mb-6">
											<div className="flex-1 rounded-lg p-3 bg-blue-50 border border-blue-100">
												<div className="text-xl font-medium text-blue-600 mb-1">
													{Number.parseInt(memoryWrites)}
												</div>
												<div className="text-xs text-blue-500">
													Total Memory Writes
												</div>
											</div>

											<div className="flex-1 rounded-lg p-3 bg-indigo-50 border border-indigo-100">
												<div className="text-xl font-medium text-indigo-600 mb-1">
													{Number.parseInt(energyConsumption)}
												</div>
												<div className="text-xs text-indigo-500">
													Energy Consumption
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</main>
				<div className="my-4 flex flex-col gap-2 shadow-lg z-10">
					{/* Toggle Button */}
					<button
						type="button"
						onClick={() => setIsMessageLogOpen(!isMessageLogOpen)}
						className="flex items-center gap-2 p-2 bg-white rounded-t-lg hover:bg-gray-50"
					>
						<FiMessageCircle className="text-xl" />
						<span className="font-bold">Message Log</span>
						{isMessageLogOpen ? <FiX /> : <FiEye />}
					</button>

					{/* Messages */}
					{isMessageLogOpen && (
						<div className="bg-white rounded-b-lg max-h-64 overflow-y-auto">
							{messageLog
								.filter((_, i) => i === currentStep - 1)
								.map((msgs, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										key={i}
										className="p-4 border-b border-gray-100"
									>
										<div className="flex flex-col gap-2">
											<div className="flex gap-1 items-center">
												<FiMessageCircle className="text-xl" />
												<span className="font-bold">COMCACHE</span>
											</div>
											<div className="whitespace-pre-line">
												<p className="px-4 font-medium">{msgs[0]}</p>
												{msgs.slice(1).map((msg, j) => (
													// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
													<p key={j} className="mt-2 px-4 text-gray-600">
														{msg}
													</p>
												))}
											</div>
										</div>
									</div>
								))}
						</div>
					)}
				</div>
			</div>
		</>
	);
}

export default AccessScreen;
