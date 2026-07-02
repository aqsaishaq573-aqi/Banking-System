import React, { useState } from 'react';
import { api } from '../services/api';
import { TCLScenarioStep } from '../types';
import { Play, RotateCcw, Database, Server, Terminal, ShieldAlert, CheckCircle, Save } from 'lucide-react';

const TCLDemo = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [demoState, setDemoState] = useState<any>(null);

  // Scenarios Definition
  const SCENARIOS = [
    {
      id: 1,
      title: "Atomic Transfer (COMMIT)",
      description: "Demonstrates a successful transfer where both debit and credit succeed, ending in a COMMIT.",
      steps: [
        { step: 1, action: "BEGIN", description: "Start Transaction Block", sql: "BEGIN TRANSACTION;" },
        { step: 2, action: "READ", description: "Check Sender Balance (Acct 1001)", sql: "SELECT Balance FROM Account WHERE ID=1001;", stateSnapshot: { sender: 50000, receiver: 120000 } },
        { step: 3, action: "UPDATE", description: "Debit Sender $5,000", sql: "UPDATE Account SET Balance = 45000 WHERE ID=1001;", stateSnapshot: { sender: 45000, receiver: 120000 } },
        { step: 4, action: "UPDATE", description: "Credit Receiver $5,000 (Acct 1002)", sql: "UPDATE Account SET Balance = 125000 WHERE ID=1002;", stateSnapshot: { sender: 45000, receiver: 125000 } },
        { step: 5, action: "COMMIT", description: "Persist changes permanently", sql: "COMMIT;", stateSnapshot: { sender: 45000, receiver: 125000 } },
      ]
    },
    {
      id: 2,
      title: "Rollback on Error",
      description: "Demonstrates data integrity. If a crash happens after debit but before credit, ROLLBACK restores original state.",
      steps: [
        { step: 1, action: "BEGIN", description: "Start Transaction Block", sql: "BEGIN TRANSACTION;" },
        { step: 2, action: "UPDATE", description: "Debit Sender $5,000", sql: "UPDATE Account SET Balance = 45000 WHERE ID=1001;", stateSnapshot: { sender: 45000, receiver: 120000 } },
        { step: 3, action: "ERROR", description: "System Failure / Constraint Violation!", sql: "-- CRITICAL ERROR DETECTED --", isError: true, stateSnapshot: { sender: 45000, receiver: 120000 } },
        { step: 4, action: "ROLLBACK", description: "Undo all changes in this transaction", sql: "ROLLBACK;", stateSnapshot: { sender: 50000, receiver: 120000 } },
      ]
    },
    {
      id: 3,
      title: "Savepoints",
      description: "Using SAVEPOINT to partially rollback a complex transaction without discarding all progress.",
      steps: [
        { step: 1, action: "BEGIN", description: "Start Transaction", sql: "BEGIN TRANSACTION;" },
        { step: 2, action: "UPDATE", description: "Update Batch 1 (Success)", sql: "UPDATE Account SET...;", stateSnapshot: { batch: 1 } },
        { step: 3, action: "SAVEPOINT", description: "Create checkpoint SP1", sql: "SAVEPOINT SP1;", stateSnapshot: { batch: 1 } },
        { step: 4, action: "UPDATE", description: "Update Batch 2 (Fails)", sql: "UPDATE Account... -- ERROR", isError: true, stateSnapshot: { batch: 1 } },
        { step: 5, action: "ROLLBACK TO", description: "Rollback to SP1", sql: "ROLLBACK TO SP1;", stateSnapshot: { batch: 1 } },
        { step: 6, action: "COMMIT", description: "Commit valid Batch 1", sql: "COMMIT;", stateSnapshot: { batch: 1 } },
      ]
    }
  ];

  const runScenario = async (scenarioIndex: number) => {
    setIsPlaying(true);
    setCurrentStep(0);
    setLogs([]);
    setDemoState(SCENARIOS[scenarioIndex].steps[0].stateSnapshot); // Init state

    const scenario = SCENARIOS[scenarioIndex];

    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      setCurrentStep(i + 1);

      // Update logs
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.sql}`]);
      if (step.stateSnapshot) setDemoState(step.stateSnapshot);

      await new Promise(r => setTimeout(r, 1500)); // Simulate processing delay
    }

    setIsPlaying(false);
  };

  const reset = () => {
    setCurrentStep(0);
    setLogs([]);
    setDemoState(null);
    // Reset would be handled by API if available
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-8 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-blue-600 rounded-full blur-3xl opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center mb-2"><Database className="mr-3 text-blue-400" /> Transaction Control (TCL) Visualizer</h1>
          <p className="text-slate-400 max-w-2xl">Interactive demonstration of ACID properties. Watch how COMMIT, ROLLBACK, and SAVEPOINT maintain data integrity in real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Select Scenario</h2>
          <div className="space-y-3">
            {SCENARIOS.map((s, idx) => (
              <button
                key={s.id}
                disabled={isPlaying}
                onClick={() => { setActiveTab(idx); reset(); }}
                className={`w-full text-left p-4 rounded-lg border transition-all ${activeTab === idx ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
              >
                <div className="font-bold text-slate-800 flex justify-between">
                  {s.title}
                  {activeTab === idx && isPlaying && <Loader2 className="animate-spin text-blue-500" size={18} />}
                </div>
                <p className="text-xs text-slate-500 mt-1">{s.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => runScenario(activeTab)}
              disabled={isPlaying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg flex items-center justify-center mb-3"
            >
              <Play size={20} className="mr-2" /> Start Simulation
            </button>
            <button onClick={reset} disabled={isPlaying} className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-lg flex items-center justify-center hover:bg-slate-50">
              <RotateCcw size={20} className="mr-2" /> Reset
            </button>
          </div>
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-2 space-y-6">

          {/* Steps Visualizer */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-8">
              {SCENARIOS[activeTab].steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center relative flex-1">
                  {/* Connector Line */}
                  {idx !== 0 && <div className={`absolute top-4 right-1/2 w-full h-1 ${currentStep > idx ? 'bg-blue-500' : 'bg-slate-200'}`} style={{ right: '50%' }}></div>}

                  {/* Circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${currentStep > idx ? (step.isError ? 'bg-red-500' : 'bg-blue-600') :
                    currentStep === idx + 1 ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400'
                    } text-white font-bold text-xs`}>
                    {step.isError ? <ShieldAlert size={14} /> : step.action === 'COMMIT' ? <CheckCircle size={14} /> : step.action === 'SAVEPOINT' ? <Save size={14} /> : idx + 1}
                  </div>

                  {/* Label */}
                  <span className={`mt-2 text-xs font-medium text-center ${currentStep === idx + 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                    {step.action}
                  </span>
                </div>
              ))}
            </div>

            {/* State Display */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Database State Snapshot</h3>
              <div className="grid grid-cols-2 gap-8">
                {demoState ? (
                  Object.entries(demoState).map(([key, val]: any) => (
                    <div key={key} className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                      <div className="text-slate-500 text-sm capitalize">{key} Account</div>
                      <div className="text-2xl font-mono font-bold text-slate-800 transition-all duration-500">
                        ${val.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-sm italic col-span-2 text-center py-4">Waiting to start transaction...</div>
                )}
              </div>
            </div>
          </div>

          {/* SQL Console */}
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-4 font-mono text-sm h-64 overflow-y-auto custom-scrollbar">
            <div className="flex items-center text-slate-400 border-b border-slate-800 pb-2 mb-2">
              <Terminal size={16} className="mr-2" /> SQL Transaction Log
            </div>
            <div className="space-y-2">
              {logs.length === 0 && <span className="text-slate-600"> Ready for input...</span>}
              {logs.map((log, i) => (
                <div key={i} className="animate-[fadeIn_0.2s_ease-out]">
                  <span className="text-green-500">postgres&gt;</span> <span className="text-slate-300">{log}</span>
                </div>
              ))}
              {isPlaying && <div className="text-blue-400 animate-pulse">_</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Required for icon usage
import { Loader2 } from 'lucide-react';

export default TCLDemo;
