import { create } from "zustand";

const useSimStore = create((set, get) => ({
	/*** CONFIGURATIONS ***/
	mode: "DIRECT_MAPPED", // "DIRECT_MAPPED", "SET_ASSOCIATIVE", "FULLY_ASSOCIATIVE"

	cacheSizeOptions: [
		8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
	], // in bytes
	blockSizeOptions: [1, 2, 4, 8, 16, 32, 64, 128], // in bytes
	associativityOptions: [1, 2, 4, 8, 16, 32, 64, 128], // number of ways
	bitAddressOptions: [8, 16, 32, 64], // total bits in address
	writePolicyOptions: ["WRITE_BACK", "WRITE_THROUGH"],

	memoryLatencyOptions: [10, 20, 50, 100, 200, 500, 1000], // in cycles
	memoryBandwidthOptions: [1, 2, 4, 8, 16, 32, 64, 128], // in bytes per cycle
	busLatencyOptions: [1, 2, 4, 8, 16, 32, 64, 128], // in cycles

	writeBufferSizeOptions: [1, 2, 4, 8, 16, 32, 64, 128], // in blocks
	writeBufferDrainRateOptions: [1, 2, 4, 8, 16, 32, 64, 128], // in blocks per cycle

	getConfigureOptions: () => {
		const {
			associativityOptions,
			bitAddressOptions,
			cacheSizeOptions,
			blockSizeOptions,
			memoryLatencyOptions,
			memoryBandwidthOptions,
			busLatencyOptions,
			writeBufferSizeOptions,
			writeBufferDrainRateOptions,
		} = get();

		return {
			associativityOptions,
			bitAddressOptions,
			cacheSizeOptions,
			blockSizeOptions,
			memoryLatencyOptions,
			memoryBandwidthOptions,
			busLatencyOptions,
			writeBufferSizeOptions,
			writeBufferDrainRateOptions,
		};
	},

	cacheConfig: {
		bitAddress: 8, // total bits in address
		cacheSize: 32, // in bytes
		blockSize: 4, // in bytes
		associativity: 1, // 1 for direct mapped; >1 for set associative; for fully associative, will be all lines
		writePolicy: "WRITE_BACK", // or "WRITE_THROUGH"
		replacementPolicy: "LRU",
		hitTime: 1,
		missPenalty: 100,
		writeBuffer: {
			enabled: false,
			size: 4,
			drainRate: 1,
		},
	},
	memoryConfig: {
		latency: 100, // in cycles
		bandwidth: 4, // in bytes per cycle
		busLatency: 16, // in cycles
	},
	cpuConfig: { cpi: 1 },
	performanceMetricsHistory: [],
	performanceMetrics: {
		hitRate: 0,
		missRate: 0,
		avgAccessTime: 0,
		readStallCycle: 0,
		writeStallCycle: 0,
		writeMissPenalty: 0,
		writeBufferStall: 0,
		cpuTime: 0,
	},

	/*** SIMULATION STATE ***/
	address: "",
	caches: [],
	simState: {
		address: "",
		caches: [],
		tag: "",
		index: null,
		offset: "",
		data: "",
		way: null,
		lastAccess: "",
		dirtyBit: false,
		message: "",
		cacheResult: "", // "HIT", "MISS", "REPLACE"
		completed: false,
	},
	previousStepValue: 0,
	currentStep: 0,
	messageLog: [],
	countCacheResult: { hit: 0, miss: 0 },
	totalReads: 0,
	totalWrites: 0,
	readMisses: 0,
	writeMisses: 0,
	accessCounter: 0,
	history: [],
	currentHistoryIndex: -1,

	/*** SETTERS & GETTERS ***/
	setConfig: (config) => {
		set((prev) => ({
			cacheConfig: { ...prev.cacheConfig, ...config.cacheConfig },
			memoryConfig: { ...prev.memoryConfig, ...config.memoryConfig },
			cpuConfig: { ...prev.cpuConfig, ...config.cpuConfig },
		}));
		get().initializeCaches();
	},

	setWritePolicy: (mode) => {
		set((prev) => ({
			cacheConfig: { ...prev.cacheConfig, writePolicy: mode },
		}));
	},

	setCurrentStep: (step) => {
		set(() => ({ currentStep: step }));
	},

	setMode: (mode) => {
		set(() => ({ mode }));
		if (mode === "DIRECT_MAPPED") {
			set((prev) => ({
				cacheConfig: { ...prev.cacheConfig, associativity: 1 },
			}));
		} else if (mode === "SET_ASSOCIATIVE") {
			set((prev) => ({
				cacheConfig: { ...prev.cacheConfig, associativity: 2 },
			}));
		} else if (mode === "FULLY_ASSOCIATIVE") {
			set((prev) => ({
				cacheConfig: {
					...prev.cacheConfig,
					associativity:
						prev.cacheConfig.cacheSize / prev.cacheConfig.blockSize,
				},
			}));
		}
		get().initializeCaches();
	},

	setCacheConfig: (config) => {
		set((prev) => ({
			cacheConfig: { ...prev.cacheConfig, ...config },
		}));
	},

	getReadMissRate: () => {
		const { totalReads, readMisses } = get();
		return totalReads > 0 ? readMisses / totalReads : 0;
	},
	getWriteMissRate: () => {
		const { totalWrites, writeMisses } = get();
		return totalWrites > 0 ? writeMisses / totalWrites : 0;
	},
	getWriteMissPenalty: () => {
		const { busLatency, bandwidth } = get().memoryConfig;
		const { blockSize, missPenalty, hitTime, writePolicy } = get().cacheConfig;
		switch (writePolicy) {
			case "WRITE_BACK":
				return missPenalty + hitTime;
			case "WRITE_THROUGH":
				return busLatency + blockSize / bandwidth;
			default:
				return 0;
		}
	},
	getWriteMissPenaltyWithBuffer: (writeStalls) => {
		const { busLatency, bandwidth } = get().memoryConfig;
		const { blockSize, missPenalty, writeBuffer, writePolicy } =
			get().cacheConfig;
		switch (writePolicy) {
			case "WRITE_BACK":
				return (
					(writeStalls / writeBuffer.size) *
					(busLatency + blockSize / bandwidth)
				);
			case "WRITE_THROUGH":
				return (writeStalls / writeBuffer.size) * missPenalty;
			default:
				return 0;
		}
	},
	getWriteBufferOverflows: () => {
		const { writeBuffer } = get().cacheConfig;
		const { writeMisses } = get();
		return Math.max(
			0,
			(writeMisses - writeBuffer.size * writeBuffer.drainRate) /
				writeBuffer.size,
		);
	},
	updatePerformanceMetrics: () => {
		const { hit, miss } = get().countCacheResult;
		const totalAccess = hit + miss;
		const hitRate = totalAccess > 0 ? hit / totalAccess : 0;
		const missRate = totalAccess > 0 ? miss / totalAccess : 0;
		const avgAccessTime =
			get().cacheConfig.hitTime + missRate * get().cacheConfig.missPenalty;
		const readStallCycle = get().getReadMissRate() * get().memoryConfig.latency;
		const writeStallCycle =
			get().getWriteMissRate() * get().cacheConfig.missPenalty;
		const writeBufferStall = get().getWriteBufferOverflows();
		const writeMissPenalty = get().cacheConfig.writeBuffer.enabled
			? get().getWriteMissPenaltyWithBuffer(writeBufferStall)
			: get().getWriteMissPenalty();
		const cpuTime = get().cpuConfig.cpi + readStallCycle + writeStallCycle;
		set(() => ({
			performanceMetrics: {
				hitRate,
				missRate,
				avgAccessTime,
				readStallCycle,
				writeStallCycle,
				writeMissPenalty,
				writeBufferStall,
				cpuTime,
			},
		}));
		set((prev) => ({
			performanceMetricsHistory: [
				...prev.performanceMetricsHistory,
				get().performanceMetrics,
			],
		}));
	},

	/*** HELPER FUNCTIONS ***/
	destructuringCache: () => {
		const { cacheSize, blockSize, associativity, bitAddress } =
			get().cacheConfig;
		const numLines = cacheSize / blockSize;
		let numSets;
		let indexSize;
		if (get().mode === "FULLY_ASSOCIATIVE") {
			numSets = 1;
			indexSize = 0;
		} else {
			numSets = numLines / associativity;
			indexSize = Math.log2(numSets);
		}
		const offsetSize = Math.log2(blockSize);
		const tagSize = bitAddress - indexSize - offsetSize;
		return { numLines, numSets, indexSize, offsetSize, tagSize };
	},
	destructuringAddress: (address) => {
		const { indexSize, offsetSize, tagSize } = get().destructuringCache();
		const binaryAddress = Number.parseInt(address, 2)
			.toString(2)
			.padStart(get().cacheConfig.bitAddress, "0");
		const offset = binaryAddress.slice(-offsetSize);
		const index =
			indexSize > 0
				? Number.parseInt(binaryAddress.slice(tagSize, tagSize + indexSize), 2)
				: 0;
		const tag = binaryAddress.slice(0, tagSize);
		const data = binaryAddress.slice(
			0,
			get().cacheConfig.bitAddress - offsetSize,
		);
		return { offset, index, tag, data };
	},

	/*** INITIALIZATION ***/
	initializeCaches: () => {
		const { cacheSize, blockSize, associativity } = get().cacheConfig;
		const numLines = cacheSize / blockSize;
		let caches;
		if (get().mode === "DIRECT_MAPPED") {
			// flat array: one line per cache index
			caches = Array.from({ length: numLines }, (_, i) => ({
				index: i,
				valid: false,
				tag: "",
				data: "",
				offset: "",
				lastAccess: 0,
				dirtyBit: false,
			}));
		} else if (get().mode === "SET_ASSOCIATIVE") {
			const numSets = numLines / associativity;
			caches = Array.from({ length: numSets }, (_, i) => ({
				index: i,
				ways: Array.from({ length: associativity }, () => ({
					valid: false,
					tag: "",
					data: "",
					offset: "",
					lastAccess: 0,
					dirtyBit: false,
				})),
			}));
		} else if (get().mode === "FULLY_ASSOCIATIVE") {
			// One set with all lines as ways
			caches = [
				{
					index: 0,
					ways: Array.from({ length: numLines }, () => ({
						valid: false,
						tag: "",
						data: "",
						offset: "",
						lastAccess: 0,
						dirtyBit: false,
					})),
				},
			];
		}
		set((state) => ({
			caches,
			simState: {
				...state.simState,
				caches,
				address: state.address,
			},
			countCacheResult: { hit: 0, miss: 0 },
			messageLog: [],
			currentStep: 0,
			accessCounter: 0,
			performanceMetrics: {
				hitRate: 0,
				missRate: 0,
				avgAccessTime: 0,
				readStallCycle: 0,
				writeStallCycle: 0,
				writeMissPenalty: 0,
				writeBufferStall: 0,
				cpuTime: 0,
			},
			performanceMetricsHistory: [],
		}));
	},

	setAccessAddress: (address) => {
		set((state) => ({
			address,
			simState: { ...state.simState, address },
		}));
	},

	/*** SIMULATION STEPS ***/
	// --- DIRECT MAPPED STEPS ---
	// --- DIRECT MAPPED STEPS ---
	directMappedSteps: [
		{
			label: "Parse Address",
			preMessage: (state) =>
				`🔍 Current Address: ${state.address}\nWe split the address into three parts:\n• Tag (${get().destructuringCache().tagSize} bits): Uniquely identifies the memory block.\n• Index (${get().destructuringCache().indexSize} bits): Determines the cache line.\n• Offset (${get().destructuringCache().offsetSize} bits): Pinpoints the exact byte in that line.`,
			actionMessage: (state) =>
				`📍 Mapping Complete:\nData will be stored in cache line at Index: ${state.index} with Tag: ${state.tag}.`,
			action: (state) => {
				const { offset, index, tag, data } = get().destructuringAddress(
					state.address,
				);
				return { ...state, offset, index, tag, data };
			},
		},
		{
			label: "Check Cache Line",
			preMessage: (state) =>
				`🔍 Inspecting cache line ${state.index} to see if it contains a valid block with Tag: ${state.tag}.`,
			actionMessage: (state) =>
				state.cacheResult === "HIT"
					? "✅ Cache Hit: The stored tag matches, so the data is already in the cache."
					: "❌ Cache Miss: The tag does not match; the data must be fetched from memory.",
			action: (state) => {
				set(() => ({ action: "SEARCH", actionToIndex: state.index }));
				const cache = state.caches.find((c) => c.index === state.index);
				if (cache) {
					if (cache.valid && cache.tag === state.tag) {
						return { ...state, cacheResult: "HIT" };
					}
					if (cache.valid && cache.tag !== state.tag) {
						set((prev) => ({ writeMisses: prev.writeMisses + 1 }));
						return { ...state, cacheResult: "REPLACE" };
					}
					set((prev) => ({ readMisses: prev.readMisses + 1 }));
					return { ...state, cacheResult: "MISS" };
				}
				return state;
			},
		},
		{
			label: "Handle Hit or Miss",
			preMessage: () =>
				"🔄 Evaluating whether the cache lookup resulted in a hit or a miss, and applying the appropriate response.",
			actionMessage: (state) =>
				state.cacheResult === "HIT"
					? `⚡ Cache Hit: Fast access achieved in ${get().cacheConfig.hitTime} cycle(s).`
					: `😮 Cache Miss: Data retrieval from memory will incur ${get().cacheConfig.missPenalty} cycle penalty.`,
			action: (state) => {
				// (Your logic to update the cache state and performance metrics)
				let newCaches = state.caches;
				if (state.cacheResult === "HIT") {
					newCaches = state.caches.map((cache) =>
						cache.index === state.index
							? { ...cache, lastAccess: get().accessCounter }
							: cache,
					);
					set((prev) => ({
						action: "HIT",
						cacheResult: "HIT",
						countCacheResult: {
							...prev.countCacheResult,
							hit: prev.countCacheResult.hit + 1,
						},
						accessCounter: prev.accessCounter + 1,
						caches: newCaches,
					}));
				} else if (state.cacheResult === "REPLACE") {
					newCaches = state.caches.map((cache) =>
						cache.index === state.index
							? {
									...cache,
									valid: false,
									tag: "outdated",
									data: "outdated",
									offset: "outdated",

									dirtyBit: false,
								}
							: cache,
					);
					set((prev) => ({
						action: "REPLACE",
						cacheResult: "REPLACE",
						countCacheResult: {
							...prev.countCacheResult,
							miss: prev.countCacheResult.miss + 1,
						},
						totalWrites: prev.totalWrites + 1,
					}));
				} else {
					newCaches = state.caches.map((cache) =>
						cache.index === state.index
							? {
									...cache,
									valid: false,
									tag: "miss",
									data: "miss",
									offset: "miss",
									dirtyBit: false,
								}
							: cache,
					);
					set((prev) => ({
						action: "MISS",
						cacheResult: "MISS",
						countCacheResult: {
							...prev.countCacheResult,
							miss: prev.countCacheResult.miss + 1,
						},
						totalReads: prev.totalReads + 1,
					}));
				}
				return { ...state, caches: newCaches };
			},
		},
		{
			label: "Write or Update Cache Line",
			preMessage: () =>
				"💾 Now we update the cache with the new data, either by writing fresh data or replacing outdated information.",
			actionMessage: (state) =>
				state.cacheResult === "REPLACE"
					? `🔄 Replacing data in cache line ${state.index}.`
					: `💾 Writing new data into cache line ${state.index}.`,
			action: (state) => {
				set(() => ({
					cacheResult: "HIT",
					action: "WRITE",
					actionToIndex: state.index,
				}));
				set((prev) => ({
					caches: prev.caches.map((cache) =>
						cache.index === state.index
							? {
									...cache,
									valid: true,
									tag: state.tag,
									data: state.data,
									offset: state.offset,
									dirtyBit: prev.cacheConfig.writePolicy === "WRITE_BACK",
								}
							: cache,
					),
				}));
				return { ...state, caches: get().caches };
			},
		},
		{
			label: "Finish",
			preMessage: () =>
				"🏁 Wrapping up the simulation and summarizing the performance metrics.",
			actionMessage: () =>
				`🎉 Direct-Mapped Simulation Complete!\nHit Rate: ${(get().performanceMetrics.hitRate * 100).toFixed(1)}% (Hits: ${get().countCacheResult.hit} / Total: ${get().countCacheResult.hit + get().countCacheResult.miss})`,
			action: (state) => {
				get().updatePerformanceMetrics();
				set(() => ({
					cacheResult: null,
					action: null,
					actionToIndex: null,
				}));
				return {
					...state,
					message: "Direct mapped simulation completed.",
				};
			},
		},
	],

	// --- SET ASSOCIATIVE STEPS ---
	setAssociativeSteps: [
		{
			label: "Parse Address",
			preMessage: (state) =>
				`🔢 Current Address: ${state.address}\nWe break down the address into:\n• Tag – Identifies the memory block.\n• Set Index – Determines which set (of ${get().destructuringCache().numSets}) stores the data.\n• Offset – Pinpoints the data's exact position within the cache line.`,
			actionMessage: (state) =>
				`📌 Mapping Complete:\nData is assigned to Set ${state.index} with Tag: ${state.tag}.`,
			action: (state) => {
				const { offset, index, tag, data } = get().destructuringAddress(
					state.address,
				);
				return { ...state, offset, index, tag, data };
			},
		},
		{
			label: "Check Cache Line",
			preMessage: (state) =>
				`🔍 Examining all ${get().cacheConfig.associativity} ways in Set ${state.index} for a matching Tag: ${state.tag}.`,
			actionMessage: (state) =>
				state.cacheResult === "HIT"
					? `✅ Cache Hit: Data found in way ${state.way}!`
					: "❌ Cache Miss: No valid entry matches the tag in this set.",
			action: (state) => {
				set(() => ({ action: "SEARCH", actionToIndex: state.index }));
				const setCache = state.caches.find((c) => c.index === state.index);
				if (setCache) {
					const hitWay = setCache.ways.find(
						(way) => way.valid && way.tag === state.tag,
					);
					if (hitWay !== undefined) {
						return {
							...state,
							cacheResult: "HIT",
							way: setCache.ways.indexOf(hitWay),
						};
					}
					const availableWayIndex = setCache.ways.findIndex(
						(way) => !way.valid,
					);
					if (availableWayIndex !== -1) {
						set((prev) => ({ readMisses: prev.readMisses + 1 }));
						return {
							...state,
							cacheResult: "MISS",
							way: availableWayIndex,
						};
					}
					set((prev) => ({
						writeMisses: prev.writeMisses + 1,
					}));
					const lruWayIndex = setCache.ways.reduce(
						(lruIndex, way, idx, ways) =>
							way.lastAccess < ways[lruIndex].lastAccess ? idx : lruIndex,
						0,
					);
					return {
						...state,
						cacheResult: "REPLACE",
						way: lruWayIndex,
					};
				}
				return state;
			},
		},
		{
			label: "Handle Hit or Miss",
			preMessage: () =>
				"🔄 Now we evaluate the lookup: Was it a hit, a miss, or is a replacement needed?",
			actionMessage: (state) =>
				state.cacheResult === "REPLACE"
					? "♻ Replacing LRU Entry: The least-recently-used slot will be replaced."
					: state.cacheResult === "MISS"
						? "➕ Empty Way Found: Data will be added to the available slot."
						: "📈 Cache Hit: Refreshing the access time for the matching entry.",
			action: (state) => {
				set((prev) => ({ ...prev, cacheResult: state.cacheResult }));
				if (state.cacheResult === "HIT") {
					const newCaches = state.caches.map((cache) =>
						cache.index === state.index
							? {
									...cache,
									ways: cache.ways.map((way, i) =>
										i === state.way
											? {
													...way,
													lastAccess: get().accessCounter,
												}
											: way,
									),
								}
							: cache,
					);
					set((prev) => ({
						action: "HIT",
						cacheResult: "HIT",
						countCacheResult: {
							...prev.countCacheResult,
							hit: prev.countCacheResult.hit + 1,
						},
						accessCounter: prev.accessCounter + 1,
						caches: newCaches,
					}));
					return { ...state };
				}
				if (state.cacheResult === "REPLACE") {
					const newCaches = state.caches.map((cache) =>
						cache.index === state.index
							? {
									...cache,
									ways: cache.ways.map((way, i) =>
										i === state.way
											? {
													valid: false,
													tag: "outdated",
													data: "outdated",
													offset: "outdated",
													dirtyBit: false,
												}
											: way,
									),
								}
							: cache,
					);
					set((prev) => ({
						action: "REPLACE",
						cacheResult: "REPLACE",
						countCacheResult: {
							...prev.countCacheResult,
							miss: prev.countCacheResult.miss + 1,
						},
						totalWrites: prev.totalWrites + 1,
					}));
					return { ...state, caches: newCaches };
				}
				const newCaches = state.caches.map((cache) =>
					cache.index === state.index
						? {
								...cache,
								ways: cache.ways.map((way, i) =>
									i === state.way
										? {
												valid: false,
												tag: "miss",
												data: "miss",
												offset: "miss",
												dirtyBit: false,
											}
										: way,
								),
							}
						: cache,
				);
				set((prev) => ({
					action: "MISS",
					cacheResult: "MISS",
					countCacheResult: {
						...prev.countCacheResult,
						miss: prev.countCacheResult.miss + 1,
					},
					totalReads: prev.totalReads + 1,
				}));
				return { ...state, caches: newCaches };
			},
		},
		{
			label: "Write or Update Cache Line",
			preMessage: (state) =>
				state.cacheResult === "REPLACE"
					? `💾 Preparing to replace outdated data in Set ${state.index} at way ${state.way}.`
					: state.cacheResult === "MISS"
						? `💾 Preparing to write new data into Set ${state.index} at way ${state.way}.`
						: "💾 Updating the cache entry to refresh its access time.",
			actionMessage: (state) =>
				`💡 Set-Associative Update:\nUsage in Set ${state.index}: ${state.caches[state.index].ways.filter((w) => w.valid).length} of ${get().cacheConfig.associativity} ways occupied.`,
			action: (state) => {
				set(() => ({
					cacheResult: "HIT",
					action: "WRITE",
					actionToIndex: state.index,
				}));
				set((prev) => ({
					caches: prev.caches.map((cacheSet) => {
						if (cacheSet.index === state.index) {
							return {
								...cacheSet,
								ways: cacheSet.ways.map((way, i) => {
									if (i === state.way) {
										return {
											valid: true,
											tag: state.tag,
											data: state.data,
											offset: state.offset,
											dirtyBit: prev.cacheConfig.writePolicy === "WRITE_BACK",
											lastAccess: prev.accessCounter,
										};
									}
									return way;
								}),
							};
						}
						return cacheSet;
					}),
				}));
				return { ...state, caches: get().caches };
			},
		},
		{
			label: "Finish",
			preMessage: () =>
				"🏁 Finalizing the simulation and summarizing key performance metrics.",
			actionMessage: () =>
				`🏁 Set-Associative Simulation Complete!\nAvg Access Time: ${get().performanceMetrics.avgAccessTime.toFixed(2)} cycles\n(Calculated as: Hit Time + Miss Rate × Miss Penalty)`,
			action: (state) => {
				get().updatePerformanceMetrics();
				set(() => ({
					cacheResult: null,
					action: null,
					actionToIndex: null,
				}));
				return { ...state };
			},
		},
	],

	// --- FULLY ASSOCIATIVE STEPS ---
	fullyAssociativeSteps: [
		{
			label: "Parse Address",
			preMessage: (state) =>
				`🌐 Current Address: ${state.address}\nSince the cache is treated as a single set, we only extract:\n• Tag (${get().destructuringCache().tagSize} bits): Uniquely identifies the memory block.\n• Offset: Pinpoints the exact data location within the block.`,
			actionMessage: (state) =>
				`🔑 Mapping Complete:\nData identified with Tag: ${state.tag} and assigned to the cache set.`,
			action: (state) => {
				const { offset, tag, data } = get().destructuringAddress(state.address);
				return { ...state, offset, index: 0, tag, data };
			},
		},
		{
			label: "Check Cache Line",
			preMessage: (state) =>
				`🔍 Checking every slot in the cache for a matching Tag: ${state.tag}.`,
			actionMessage: (state) =>
				state.cacheResult === "HIT"
					? "🎯 Cache Hit: Data found in the cache!"
					: "🌌 Cache Miss: No matching entry found; data will be fetched from memory.",
			action: (state) => {
				set(() => ({ action: "SEARCH", actionToIndex: 0 }));
				const cacheSet = get().caches[0]; // only one set exists
				if (cacheSet) {
					const hitWay = cacheSet.ways.find(
						(way) => way.valid && way.tag === state.tag,
					);
					if (hitWay !== undefined) {
						return {
							...state,
							cacheResult: "HIT",
							way: cacheSet.ways.indexOf(hitWay),
						};
					}
					const availableWayIndex = cacheSet.ways.findIndex(
						(way) => !way.valid,
					);
					if (availableWayIndex !== -1) {
						set((prev) => ({ readMisses: prev.readMisses + 1 }));
						return {
							...state,
							cacheResult: "MISS",
							way: availableWayIndex,
						};
					}
					set((prev) => ({
						writeMisses: prev.writeMisses + 1,
					}));
					const lruWayIndex = cacheSet.ways.reduce(
						(lruIndex, way, idx, ways) =>
							way.lastAccess < ways[lruIndex].lastAccess ? idx : lruIndex,
						0,
					);
					return {
						...state,
						cacheResult: "REPLACE",
						way: lruWayIndex,
					};
				}
				return state;
			},
		},
		{
			label: "Handle Hit or Miss",
			preMessage: () =>
				"🔄 Evaluating whether the data retrieval was successful (hit) or if an update is needed.",
			actionMessage: (state) =>
				state.cacheResult === "REPLACE"
					? "⏳ Replacing Old Entry: Updating the cache using the LRU policy."
					: "🆕 Updating Cache: Either adding new data or refreshing an existing entry.",
			action: (state) => {
				set((prev) => ({ ...prev, cacheResult: state.cacheResult }));
				if (state.cacheResult === "HIT") {
					const newCaches = state.caches.map((cache) =>
						cache.index === state.index
							? {
									...cache,
									ways: cache.ways.map((way, i) =>
										i === state.way
											? {
													...way,
													lastAccess: get().accessCounter,
												}
											: way,
									),
								}
							: cache,
					);
					set((prev) => ({
						action: "HIT",
						cacheResult: "HIT",
						countCacheResult: {
							...prev.countCacheResult,
							hit: prev.countCacheResult.hit + 1,
						},
						accessCounter: prev.accessCounter + 1,
						caches: newCaches,
					}));
					return { ...state };
				}
				if (state.cacheResult === "REPLACE") {
					const newCaches = state.caches.map((cache) =>
						cache.index === state.index
							? {
									...cache,
									ways: cache.ways.map((way, i) =>
										i === state.way
											? {
													valid: false,
													tag: "outdated",
													data: "outdated",
													offset: "outdated",
													dirtyBit: false,
												}
											: way,
									),
								}
							: cache,
					);
					set((prev) => ({
						action: "REPLACE",
						cacheResult: "REPLACE",
						countCacheResult: {
							...prev.countCacheResult,
							miss: prev.countCacheResult.miss + 1,
						},
						totalWrites: prev.totalWrites + 1,
					}));
					return { ...state, caches: newCaches };
				}
				const newCaches = state.caches.map((cache) =>
					cache.index === state.index
						? {
								...cache,
								ways: cache.ways.map((way, i) =>
									i === state.way
										? {
												valid: false,
												tag: "miss",
												data: "miss",
												offset: "miss",
												dirtyBit: false,
											}
										: way,
								),
							}
						: cache,
				);
				set((prev) => ({
					action: "MISS",
					cacheResult: "MISS",
					countCacheResult: {
						...prev.countCacheResult,
						miss: prev.countCacheResult.miss + 1,
					},
					totalReads: prev.totalReads + 1,
				}));
				return { ...state, caches: newCaches };
			},
		},
		{
			label: "Write or Update Cache Line",
			preMessage: () =>
				"💾 Updating the cache with new data or replacing outdated data as needed.",
			actionMessage: (state) =>
				`📊 Cache Write:\nCache usage: ${state.caches[0].ways.filter((w) => w.valid).length} of ${state.caches[0].ways.length} slots used.`,
			action: (state) => {
				set(() => ({
					cacheResult: "HIT",
					action: "WRITE",
					actionToIndex: 0,
				}));
				set((prev) => ({
					caches: prev.caches.map((cacheSet) => ({
						...cacheSet,
						ways: cacheSet.ways.map((way, i) => {
							if (i === state.way) {
								return {
									valid: true,
									tag: state.tag,
									data: state.data,
									offset: state.offset,
									dirtyBit: prev.cacheConfig.writePolicy === "WRITE_BACK",
									lastAccess: prev.accessCounter,
								};
							}
							return way;
						}),
					})),
				}));
				return { ...state, caches: get().caches };
			},
		},
		{
			label: "Finish",
			preMessage: () =>
				"🏁 Finalizing the simulation and summarizing overall cache performance.",
			actionMessage: () =>
				`🚀 Fully Associative Simulation Complete!\nTotal Misses: ${get().countCacheResult.miss}\n(Miss Rate: ${(get().performanceMetrics.missRate * 100).toFixed(1)}%)`,
			action: (state) => {
				get().updatePerformanceMetrics();
				set(() => ({
					cacheResult: null,
					action: null,
					actionToIndex: null,
				}));
				return { ...state };
			},
		},
	],

	/*** STEP HANDLING ***/
	getSteps: () => {
		const mode = get().mode;
		switch (mode) {
			case "DIRECT_MAPPED":
				return get().directMappedSteps;
			case "SET_ASSOCIATIVE":
				return get().setAssociativeSteps;
			case "FULLY_ASSOCIATIVE":
				return get().fullyAssociativeSteps;
			default:
				return [];
		}
	},
	nextStep: () => {
		const steps = get().getSteps();
		const currentStep = get().currentStep;
		if (currentStep < steps.length) {
			const step = steps[currentStep];
			const currentSimState = get().simState;
			const newState = step.action(currentSimState);
			const preMsg = step.preMessage ? step.preMessage(newState) : null;
			const actionMsg = step.actionMessage(newState);

			set((state) => {
				const newMessageLog = [...state.messageLog];
				if (preMsg) {
					newMessageLog[currentStep] = [preMsg, actionMsg];
				} else {
					newMessageLog[currentStep] = ["", actionMsg];
				}

				const updatedState = {
					...state,
					simState: newState,
					currentStep: state.currentStep + 1,
					messageLog: newMessageLog,
					caches: newState.caches || state.caches,
				};

				const historyEntry = {
					caches: updatedState.caches,
					countCacheResult: updatedState.countCacheResult,
					messageLog: updatedState.messageLog,
					currentStep: updatedState.currentStep,
					simState: updatedState.simState,
					address: updatedState.address,
					action: updatedState.action,
					actionToIndex: updatedState.actionToIndex,
					cacheResult: updatedState.cacheResult,
				};

				return {
					...updatedState,
					history: [...state.history, historyEntry],
					currentHistoryIndex: state.history.length,
				};
			});
			if (
				step.label === "Write or Update Cache Line" &&
				newState.cacheResult === "HIT"
			) {
				setTimeout(() => get().nextStep(), 0);
			}
		}
	},
	previousStep: () => {
		set((state) => {
			if (state.currentHistoryIndex > 0) {
				const prevIndex = state.currentHistoryIndex - 1;
				const prevState = state.history[prevIndex];
				return {
					...prevState,
					history: state.history,
					currentHistoryIndex: prevIndex,
				};
			}
			return state;
		});
	},
	resetSim: () => {
		const currentCaches = get().caches;
		let resetCaches;
		if (get().mode === "DIRECT_MAPPED") {
			resetCaches = currentCaches.map((cache) => ({
				...cache,
				valid: false,
				tag: "",
				data: "",
				offset: "",
				lastAccess: 0,
			}));
		} else if (
			get().mode === "SET_ASSOCIATIVE" ||
			get().mode === "FULLY_ASSOCIATIVE"
		) {
			resetCaches = currentCaches.map((cacheSet) => ({
				...cacheSet,
				ways: cacheSet.ways.map((way) => ({
					...way,
					valid: false,
					tag: "",
					data: "",
					offset: "",
					lastAccess: 0,
				})),
			}));
		}

		const initialState = {
			caches: resetCaches,
			countCacheResult: { hit: 0, miss: 0 },
			messageLog: [],
			currentStep: 0,
			simState: {
				address: "",
				caches: resetCaches,
				completed: false,
				tag: "",
				index: "",
				offset: "",
				data: "",
				message: "",
				cacheResult: "",
				lastAccess: 0,
			},
			totalReads: 0,
			totalWrites: 0,
			readMisses: 0,
			writeMisses: 0,
			accessCounter: 0,
			performanceMetrics: {
				hitRate: 0,
				missRate: 0,
				avgAccessTime: 0,
				readStallCycle: 0,
				writeStallCycle: 0,
				writeMissPenalty: 0,
				writeBufferStall: 0,
				cpuTime: 0,
			},
		};
		set({
			history: [initialState],
			currentHistoryIndex: 0,
			action: "",
			actionToIndex: null,
			cacheResult: "",
			currentStep: 0,
			messageLog: [],
			simState: {
				address: "",
				caches: resetCaches,
				completed: false,
				tag: "",
				index: "",
				offset: "",
				data: "",
				message: "",
				cacheResult: "",
				lastAccess: 0,
			},
			caches: resetCaches,
			countCacheResult: { hit: 0, miss: 0 },
			address: "",
			accessCounter: 0,
		});
	},

	clearCompleted: () => {
		set((state) => ({
			simState: {
				...state.simState,
				completed: false,
			},
		}));
	},
}));

export default useSimStore;
