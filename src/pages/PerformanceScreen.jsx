import React from "react";
import {
  FiSliders,
  FiCheck,
  FiX,
  FiMessageCircle,
  FiEye,
  FiPlus,
  FiRepeat,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import CustomTable from "../components/CustomTable";
import { motion } from "framer-motion";
import useSimStore from "../hooks/store";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

function PerformanceScreen() {
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
    performanceMetrics,
    performanceMetricsHistory,
    setMode,
    setCurrentStep,
    clearCompleted,
    mode,
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
  } = performanceMetrics;

  const animatedCacheTypeButton = {
    active: {
      backgroundColor: "#99CDED",
      color: "#fff",
    },
    inactive: {
      backgroundColor: "#fff",
      color: "#000",
    },
  };

  const { hit, miss } = countCacheResult;
  const [hitCount, setHitCount] = useState(hit);
  const [missCount, setMissCount] = useState(miss);

  useEffect(() => {
    setHitCount(hit);
    setMissCount(miss);
  }, [hit, miss]);

  const handleChangeCacheType = (type) => {
    setMode(type);
  };

  const [selectedBlock, setSelectedBlock] = useState(null);
  const addresses = [
    // Initial fill (3 unique blocks)
    "00000000", // Block A (Index 0)
    "00100000", // Block B (Index 0)
    "01000000", // Block C (Index 0)

    // LRU order: A(1) → B(2) → C(3)
    "00000000", // Re-access A - becomes MRU (Direct: MISS, 2-Way: HIT)
    "00100000", // Re-access B - becomes MRU (Direct: MISS, 2-Way: HIT)

    // Force replacement
    "01100000", // Block D (Index 0) - replaces LRU (C) in 2-Way

    // Verify replacements
    "01000000", // C - MISS in both (was replaced)
    "00000000", // A - HIT in 2-Way (still present), MISS in Direct
    "00100000", // B - HIT in 2-Way (still present), MISS in Direct

    // Final LRU test
    "01100000", // D - HIT in 2-Way (now MRU)
    "01000000", // C - MISS (replaces A in 2-Way)
  ];

  const [currentAddressIndex, setCurrentAddressIndex] = useState(addresses[0]);

  useEffect(() => {
    resetSim();
    initializeCaches();
    setAccessAddress(addresses[0]);
    setCurrentAddressIndex(0);
  }, [initializeCaches, mode]);

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

  return (
    <>
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 items-center">
            <FiSliders className="text-2xl" />
            <h1 className="text-2xl font-bold">Cache Performance View</h1>
          </div>
          <button className="px-4 py-1 rounded-lg bg-white hover:bg-gray-50 ">
            Configure
          </button>
        </div>
        <div className="flex gap-2">
          <motion.button
            animate={mode === CacheTypes.DIRECT_MAPPED ? "active" : "inactive"}
            variants={animatedCacheTypeButton}
            onClick={() => handleChangeCacheType(CacheTypes.DIRECT_MAPPED)}
            className="text-sm px-4 py-2 rounded-lg font-bold"
          >
            DIRECT MAPPED
          </motion.button>
          <motion.button
            animate={
              mode === CacheTypes.SET_ASSOCIATIVE ? "active" : "inactive"
            }
            variants={animatedCacheTypeButton}
            onClick={() => handleChangeCacheType(CacheTypes.SET_ASSOCIATIVE)}
            className="text-sm px-4 py-2 rounded-lg font-bold"
          >
            SET ASSOCIATIVE
          </motion.button>
          <motion.button
            animate={
              mode === CacheTypes.FULLY_ASSOCIATIVE ? "active" : "inactive"
            }
            variants={animatedCacheTypeButton}
            onClick={() => handleChangeCacheType(CacheTypes.FULLY_ASSOCIATIVE)}
            className="text-sm px-4 py-2 rounded-lg font-bold"
          >
            FULLY ASSOCIATIVE
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
          {/* Cache Performance Overview */}
          <div className="flex flex-col w-full ">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Cache Performance
            </h3>
            <div className="flex justify-between w-full gap-12">
              <div className="bg-white flex-1 rounded-lg shadow-sm border border-gray-100 p-6">
                <div>
                  <Line data={data} options={options} />
                </div>
                {/* Hit/Miss Rate Cards */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <div className="text-3xl font-semibold text-emerald-600 mb-1">
                      {parseFloat(hitRate * 100).toFixed(4)}%
                    </div>
                    <div className="text-xs font-medium text-emerald-500">
                      Hit Rate
                    </div>
                  </div>

                  <div className="flex-1 bg-rose-50 rounded-lg p-4 border border-rose-100">
                    <div className="text-3xl font-semibold text-rose-600 mb-1">
                      {parseFloat(missRate * 100).toFixed(4)}%
                    </div>
                    <div className="text-xs font-medium text-rose-500">
                      Miss Rate
                    </div>
                  </div>
                </div>

                {/* AMAT Card */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                  <div className="text-2xl font-semibold text-gray-700 mb-1">
                    {parseFloat(avgAccessTime).toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Average Access Memory Time (AMAT)
                  </div>
                </div>

                {/* Stall Cycles */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 rounded-lg p-3 bg-blue-50 border border-blue-100">
                    <div className="text-xl font-medium text-blue-600 mb-1">
                      {parseInt(readStallCycle)}
                    </div>
                    <div className="text-xs text-blue-500">
                      Read Stall Cycles
                    </div>
                  </div>

                  <div className="flex-1 rounded-lg p-3 bg-indigo-50 border border-indigo-100">
                    <div className="text-xl font-medium text-indigo-600 mb-1">
                      {parseInt(writeStallCycle)}
                    </div>
                    <div className="text-xs text-indigo-500">
                      Write Stall Cycles
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500 ">
                      Value from current access
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-500">
                      Write Miss Penalty
                    </span>
                    <span className="font-medium text-gray-700">
                      {parseInt(writeMissPenalty)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-500">
                      Write Buffer Stall
                    </span>
                    <span className="font-medium text-gray-700">
                      {parseInt(writeBufferStall)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-500">CPU Time</span>
                    <span className="font-medium text-gray-700">
                      {parseFloat(cpuTime).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Simulation */}
              <div className="flex-1">
                <CustomTable
                  caches={caches}
                  cacheType={mode}
                  cacheResult={cacheResult}
                  associativity={cacheConfig.associativity}
                  actionToIndex={actionToIndex}
                  action={action}
                  actionWay={simState.way}
                  writePolicy={cacheConfig.writePolicy}
                  iconAction={
                    action == "SEARCH" ? (
                      <FiEye />
                    ) : action == "WRITE" ? (
                      <FiPlus />
                    ) : action == "REPLACE" ? (
                      <FiRepeat />
                    ) : null
                  }
                />
              </div>
            </div>
          </div>
        </main>
        <div className="relative">
          <div className="my-4 flex flex-col gap-2 absolute top-0">
            <div className="space-x-2">
              <motion.button
                onClick={() => handleReset()}
                className="text-sm text-white px-4 py-2 bg-red-400 rounded-lg font-bold"
              >
                Reset
              </motion.button>
              <motion.button
                onClick={() => handlePreviousStep()}
                className="text-sm px-4 py-2 bg-white rounded-lg font-bold"
              >
                Previous
              </motion.button>
              <motion.button
                onClick={() => handleNextStep()}
                className="text-sm px-4 py-2 bg-white rounded-lg font-bold"
              >
                Next
              </motion.button>
              <motion.button
                onClick={() => handleFastForward()}
                className="text-sm text-white px-4 py-2 bg-green-400 rounded-lg font-bold"
              >
                Fast Forward
              </motion.button>
            </div>

            {/* Messages */}
            <div className="min-h-48">
              {messageLog
                .filter((_, i) => i === currentStep - 1)
                .map((msgs, i) => (
                  <div className="mt-4 bg-white rounded-xl h-full w-fit">
                    <div key={i} className="flex flex-col gap-2 p-4">
                      <div className="flex gap-1 items-center">
                        <FiMessageCircle className="text-xl" />
                        <span className="font-bold">COMCACHE</span>
                      </div>
                      <div className="whitespace-pre-line">
                        <p className="px-4 font-medium">{msgs[0]}</p>
                        {msgs.slice(1).map((msg, j) => {
                          return (
                            <p key={j} className="mt-2 px-4 text-gray-600">
                              {msg}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PerformanceScreen;
