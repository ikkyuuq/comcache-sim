import {
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Modal,
	Select,
} from "@mui/material";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import useSimStore from "../hooks/store";
import PresetMotionButton from "./PresetMotionButton";

function ModalConfig({
	CacheTypes,
	modalConfigurationOpen,
	setModalConfigurationOpen,
}) {
	const {
		associativityOptions,
		bitAddressOptions,
		cacheSizeOptions,
		blockSizeOptions,
		memoryLatencyOptions,
		memoryBandwidthOptions,
		busLatencyOptions,
		memoryConfig,
		cpuConfig,
		cacheConfig,
		resetSim,
		mode,
		setConfig,
		setMode,
	} = useSimStore();

	const [cacheConfigs, setCacheConfigs] = useState(cacheConfig);
	const [memoryConfigs, setMemoryConfigs] = useState(memoryConfig);
	const [cpuConfigs, setCpuConfigs] = useState(cpuConfig);

	const [preset, setPreset] = useState(null);

	useEffect(() => {
		console.log(cacheConfigs.associativity);
		setCacheConfigs((prev) => ({
			...prev,
			associativity:
				mode === CacheTypes.SET_ASSOCIATIVE
					? cacheConfigs.associativity || 2
					: mode === CacheTypes.FULLY_ASSOCIATIVE
						? cacheConfigs.cacheSize / cacheConfigs.blockSize
						: 1,
		}));
	}, [
		mode,
		cacheConfigs.associativity,
		cacheConfigs.cacheSize,
		cacheConfigs.blockSize,
		CacheTypes,
	]);

	const handleCloseModal = () => {
		setModalConfigurationOpen(false);
	};
	const handleChangeCacheType = (type) => {
		setMode(type);
		const newAssociativity =
			type === CacheTypes.SET_ASSOCIATIVE
				? cacheConfigs.associativity || 2
				: type === CacheTypes.FULLY_ASSOCIATIVE
					? cacheConfigs.cacheSize / cacheConfigs.blockSize
					: 1;

		console.log(newAssociativity);
		setCacheConfigs((prev) => ({
			...prev,
			associativity: newAssociativity,
		}));
		resetSim();
	};
	const handleConfirmChangeConfiguration = () => {
		setConfig({
			cacheConfig: cacheConfigs,
			memoryConfig: memoryConfigs,
			cpuConfig: cpuConfigs,
		});
		setModalConfigurationOpen(false);
	};
	return (
		<Modal
			className="w-full"
			open={modalConfigurationOpen}
			onClose={handleCloseModal}
		>
			<div className="w-200 absolute top-1/2 left-1/2 -translate-1/2 p-4 bg-white rounded-lg">
				{/** Cache Config **/}
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-4">
						<span className="text-gray-400 font-bold">Cache Configuration</span>
						{/** Bit Address Size **/}
						<FormControl fullWidth>
							<InputLabel id="bitAddressSizeLabel">Bit Address</InputLabel>
							<Select
								value={cacheConfigs.bitAddress}
								labelId="bitAddressSizeLabel"
								id="bitAddressSizeSelect"
								label="Bit Address"
								onChange={(e) =>
									setCacheConfigs((prev) => ({
										...prev,
										bitAddress: e.target.value,
									}))
								}
							>
								{bitAddressOptions.map((v, i) => {
									return (
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										<MenuItem key={i} value={v}>
											{v}
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
						<div className="flex gap-4">
							{/** Cache Size **/}
							<FormControl fullWidth>
								<InputLabel id="cacheSizeLabel">Cache Size</InputLabel>
								<Select
									value={cacheConfigs.cacheSize}
									labelId="cacheSizeLabel"
									id="cacheSizeSelect"
									label="Cache Size"
									onChange={(e) =>
										setCacheConfigs((prev) => ({
											...prev,
											cacheSize: e.target.value,
										}))
									}
								>
									{cacheSizeOptions.map((v, i) => {
										return (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<MenuItem key={i} value={v}>
												{v}
											</MenuItem>
										);
									})}
								</Select>
								<FormHelperText>in bytes</FormHelperText>
							</FormControl>
							{/** Block Size **/}
							<FormControl fullWidth>
								<InputLabel id="blockSizeLabel">Block Size</InputLabel>
								<Select
									value={cacheConfigs.blockSize}
									labelId="blockSizeLabel"
									id="blockSizeSelect"
									label="Block Size"
									onChange={(e) =>
										setCacheConfigs((prev) => ({
											...prev,
											blockSize: e.target.value,
										}))
									}
								>
									{blockSizeOptions.map((v, i) => {
										return (
											<MenuItem
												disabled={v > cacheConfigs.cacheSize}
												// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
												key={i}
												value={v}
											>
												{v}
											</MenuItem>
										);
									})}
								</Select>
								<FormHelperText>in bytes</FormHelperText>
							</FormControl>
						</div>
						{/** Associativity **/}
						<FormControl fullWidth>
							<InputLabel id="associativitySizeLabel">Associativity</InputLabel>
							<Select
								value={cacheConfigs.associativity}
								labelId="associativitySizeLabel"
								id="associativitySizeSelect"
								label="Associativity"
								onChange={(e) =>
									setCacheConfigs((prev) => ({
										...prev,
										associativity: e.target.value,
									}))
								}
							>
								{associativityOptions.map((v, i) => {
									return (
										<MenuItem
											disabled={
												(mode === CacheTypes.SET_ASSOCIATIVE && v === 1) ||
												(mode === CacheTypes.FULLY_ASSOCIATIVE &&
													v !==
														cacheConfigs.cacheSize / cacheConfigs.blockSize) ||
												(mode === CacheTypes.DIRECT_MAPPED && v !== 1)
											}
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											key={i}
											value={v}
										>
											{v}
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
					</div>

					{/** Memory Config **/}
					<div className="flex flex-col gap-4">
						<span className="text-gray-400 font-bold">
							Memory Configuration
						</span>
						<div className="flex gap-4">
							{/** Memory Latency **/}
							<FormControl fullWidth>
								<InputLabel id="memoryLatencySizeLabel">
									Memory Latency
								</InputLabel>
								<Select
									value={memoryConfigs.latency}
									labelId="memoryLatencySizeLabel"
									id="memoryLatencySizeSelect"
									label="Memory Latency"
									onChange={(e) =>
										setMemoryConfigs((prev) => ({
											...prev,
											latency: e.target.value,
										}))
									}
								>
									{memoryLatencyOptions.map((v, i) => {
										return (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<MenuItem key={i} value={v}>
												{v}
											</MenuItem>
										);
									})}
								</Select>
								<FormHelperText>in cycles</FormHelperText>
							</FormControl>
							{/** Bus Latency **/}
							<FormControl fullWidth>
								<InputLabel id="busLatencyLabel">Bus Latency</InputLabel>
								<Select
									value={memoryConfigs.busLatency}
									labelId="busLatencyLabel"
									id="busLatencySelect"
									label="Bus Latency"
									onChange={(e) =>
										setMemoryConfigs((prev) => ({
											...prev,
											busLatency: e.target.value,
										}))
									}
								>
									{busLatencyOptions.map((v, i) => {
										return (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<MenuItem key={i} value={v}>
												{v}
											</MenuItem>
										);
									})}
								</Select>
								<FormHelperText>in cycles</FormHelperText>
							</FormControl>
						</div>
						{/** Memory Bandwidth **/}
						<FormControl fullWidth>
							<InputLabel id="memoryBandwidthLabel">Bandwidth</InputLabel>
							<Select
								value={memoryConfigs.bandwidth}
								labelId="memoryBandwidthLabel"
								id="memoryBandwidthSelect"
								label="Bandwidth"
								onChange={(e) =>
									setMemoryConfigs((prev) => ({
										...prev,
										bandwidth: e.target.value,
									}))
								}
							>
								{memoryBandwidthOptions.map((v, i) => {
									return (
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										<MenuItem key={i} value={v}>
											{v}
										</MenuItem>
									);
								})}
							</Select>
							<FormHelperText>in byte per cycle</FormHelperText>
						</FormControl>
					</div>

					<div className="flex flex-col gap-4">
						<span className="text-gray-400 font-bold">Presets :</span>
						<div className="flex gap-4">
							<PresetMotionButton
								title="Simple Direct-Mapped"
								isActive={preset === "SIMPLE_DIRECT_MAPPED"}
								onClick={() => {
									setPreset("SIMPLE_DIRECT_MAPPED");
									handleChangeCacheType(CacheTypes.DIRECT_MAPPED);
									setCacheConfigs({
										bitAddress: 8,
										cacheSize: 16,
										blockSize: 4,
										associativity: 1,
									});
									setMemoryConfigs({
										latency: 10,
										bandwidth: 2,
										busLatency: 2,
									});
								}}
							/>
							<PresetMotionButton
								title="Simple 2-Way Set"
								isActive={preset === "SIMPLE_2_WAY_SET"}
								onClick={() => {
									setPreset("SIMPLE_2_WAY_SET");
									handleChangeCacheType(CacheTypes.SET_ASSOCIATIVE);
									setCacheConfigs({
										bitAddress: 8,
										cacheSize: 16,
										blockSize: 4,
										associativity: 2,
									});
									setMemoryConfigs({
										latency: 10,
										bandwidth: 2,
										busLatency: 2,
									});
								}}
							/>
							<PresetMotionButton
								title="Simple Fully Assoc"
								isActive={preset === "SIMPLE_FULLY_ASSOC"}
								onClick={() => {
									setPreset("SIMPLE_FULLY_ASSOC");
									handleChangeCacheType(CacheTypes.FULLY_ASSOCIATIVE);
									setCacheConfigs({
										bitAddress: 8,
										cacheSize: 16,
										blockSize: 4,
										associativity: 4,
									});
									setMemoryConfigs({
										latency: 10,
										bandwidth: 2,
										busLatency: 2,
									});
								}}
							/>
							<PresetMotionButton
								title="Realistic 8-Way Set"
								isActive={preset === "REALISTIC"}
								onClick={() => {
									setPreset("REALISTIC");
									handleChangeCacheType(CacheTypes.SET_ASSOCIATIVE);
									setCacheConfigs({
										bitAddress: 32,
										cacheSize: 32768,
										blockSize: 64,
										associativity: 8,
									});
									setMemoryConfigs({
										latency: 100,
										bandwidth: 8,
										busLatency: 16,
									});
								}}
							/>
						</div>
					</div>
					<button
						type="button"
						onClick={handleConfirmChangeConfiguration}
						className="bg-black text-white p-3 rounded-lg hover:bg-zinc-800 cursor-pointer"
					>
						Confirm
					</button>
				</div>
			</div>
		</Modal>
	);
}

ModalConfig.propTypes = {
	CacheTypes: PropTypes.object,
	modalConfigurationOpen: PropTypes.bool,
	setModalConfigurationOpen: PropTypes.func.isRequired,
};

export default ModalConfig;
