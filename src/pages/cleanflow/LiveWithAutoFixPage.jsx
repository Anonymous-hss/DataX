import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  Archive, 
  Save, 
  Play, 
  Pause, 
  Check, 
  Loader2 
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import PipelineFlowNodes from '../../components/cleanflow/PipelineFlowNodes';
import LiveChart from '../../components/cleanflow/LiveChart';
import LiveActivityFeed from '../../components/cleanflow/LiveActivityFeed';
import LiveNotificationToast from '../../components/cleanflow/LiveNotificationToast';

export default function LiveWithAutoFixPage({ onBack }) {
  const { navigateTo } = useNavigation();
  const [timeRange, setTimeRange] = useState('15 min');
  const [autoFixOn, setAutoFixOn] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [toast, setToast] = useState({
    visible: true,
    type: 'live',
    title: 'Thread is live',
    message: 'Rules now run on every new row from raw_source_users.',
    actionText: 'View run'
  });

  const [activities, setActivities] = useState([
    { id: 1, type: 'chart', title: '64 rows checked', subtitle: '61 clean · 3 auto-fixed', time: '12:41' },
    { id: 2, type: 'zap', title: 'Quarantine re-checked', subtitle: '4 rows fixed and written to target', time: '12:41' },
    { id: 3, type: 'quarantine', title: '2 rows quarantined', subtitle: 'Failed "Email has a valid format"', time: '12:40' },
    { id: 4, type: 'live', title: 'Thread went live', subtitle: '5 rules · auto-fix on', time: '12:40' },
  ]);

  // Clean timer reference to avoid memory leaks
  const timerRef = useRef(null);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getFormattedTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Handle Save settings
  const handleSave = () => {
    if (isSaving) return;
    setIsSaving(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);

      const currentTime = getFormattedTime();
      setActivities(prev => [
        {
          id: `save-${Date.now()}`,
          type: 'save',
          title: 'Configuration saved',
          subtitle: `Auto-fix ${autoFixOn ? 'enabled' : 'disabled'} · Thread state persisted`,
          time: currentTime
        },
        ...prev
      ]);

      setToast({
        visible: true,
        type: 'saved',
        title: 'Settings saved',
        message: 'Thread parameters and auto-fix rules successfully persisted.',
        actionText: 'Dismiss'
      });

      // Auto revert Saved! button label back to Save after 2.5s
      timerRef.current = setTimeout(() => {
        setIsSaved(false);
      }, 2500);
    }, 450);
  };

  // Handle Pause / Resume toggle
  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    const currentTime = getFormattedTime();

    if (nextPaused) {
      setActivities(prev => [
        {
          id: `pause-${Date.now()}`,
          type: 'pause',
          title: 'Thread execution paused',
          subtitle: 'Streaming ingestion and auto-fix rules held',
          time: currentTime
        },
        ...prev
      ]);

      setToast({
        visible: true,
        type: 'paused',
        title: 'Thread paused',
        message: 'Streaming ingestion is temporarily paused.',
        actionText: 'Resume'
      });
    } else {
      setActivities(prev => [
        {
          id: `resume-${Date.now()}`,
          type: 'resume',
          title: 'Thread resumed',
          subtitle: 'Streaming pipeline active and processing rows',
          time: currentTime
        },
        ...prev
      ]);

      setToast({
        visible: true,
        type: 'live',
        title: 'Thread is live',
        message: 'Rules now run on every new row from raw_source_users.',
        actionText: 'View run'
      });
    }
  };

  const handleToastAction = () => {
    if (toast.type === 'paused') {
      handleTogglePause();
    } else if (toast.type === 'saved') {
      setToast(prev => ({ ...prev, visible: false }));
    } else {
      alert("Viewing live streaming run in production_db...");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-0 font-sans"
    >
      {/* Subheader bar — full-bleed matching design */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: Back & Thread Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onBack ? onBack() : navigateTo('dry-run-results')}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
              title="Back to dry run results"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                  User records clean-up
                </h1>
                {isPaused ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Paused
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {isPaused 
                  ? 'production_db → reconciled_db · execution held' 
                  : 'production_db → reconciled_db · live since 12:40'}
              </p>
            </div>
          </div>

          {/* Right: Controls & Metrics */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs shrink-0">
            {/* Health Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Health 97.1%
            </span>

            {/* Auto-fix Toggle Pill */}
            <button
              onClick={() => setAutoFixOn(!autoFixOn)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold shadow-2xs cursor-pointer hover:bg-blue-100 transition-colors"
              title={`Toggle auto-fix (currently ${autoFixOn ? 'ON' : 'OFF'})`}
            >
              <Zap className="w-3 h-3 fill-blue-600 text-blue-600" />
              Auto-fix
              <span className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${autoFixOn ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <span className={`w-3 h-3 rounded-full bg-white transition-transform ${autoFixOn ? 'translate-x-3' : 'translate-x-0'}`} />
              </span>
            </button>

            {/* Quarantine Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold shadow-2xs">
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              Quarantine 36
            </span>

            {/* Save Button */}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                isSaved 
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold shadow-2xs' 
                  : isSaving
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title="Save thread settings and rules"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Saving...
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" /> Saved!
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 text-slate-600" /> Save
                </>
              )}
            </button>

            {/* Dry Run Button */}
            <button 
              onClick={() => navigateTo('running-dry-run')}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
              title="Run a sandbox dry run"
            >
              <Play className="w-3 h-3 text-slate-600" /> Dry run
            </button>

            {/* Pause / Resume Button */}
            <button 
              onClick={handleTogglePause}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                isPaused 
                  ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold shadow-2xs' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title={isPaused ? "Resume thread streaming" : "Pause thread streaming"}
            >
              {isPaused ? (
                <>
                  <Play className="w-3 h-3 text-amber-600 fill-amber-600" /> Resume
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-slate-600" /> Pause
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline + Chart Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">

        {/* 3 Pipeline Flow Nodes */}
        <PipelineFlowNodes currentStep="08" isPaused={isPaused} />

        {/* Main Content Card: Rows per minute & Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Left Column: Rows per minute chart */}
            <LiveChart 
              timeRange={timeRange} 
              setTimeRange={setTimeRange} 
            />

            {/* Right Column: Live Activity Feed */}
            <LiveActivityFeed 
              activities={activities} 
              onViewAll={() => alert("Viewing all live events recorded across stream.")}
            />

          </div>
        </div>
      </div>

      {/* Floating Toast — fixed to bottom-right of viewport */}
      <LiveNotificationToast 
        toast={toast}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        onAction={handleToastAction}
      />

    </motion.div>
  );
}
