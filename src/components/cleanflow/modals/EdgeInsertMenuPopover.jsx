import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  GitFork,
  UserCheck,
  Search,
  X,
  ArrowRight,
  Database,
  Layers,
  Sliders,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  Workflow
} from 'lucide-react';
import { API_BASE_URL } from '../../../services/apiClient';

export default function EdgeInsertMenuPopover({
  isOpen,
  onClose,
  edge,
  fromNode,
  toNode,
  position = { x: 400, y: 300 },
  onSelectNodeType,
  onOpenBuildWithAi
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [edgeData, setEdgeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && edge) {
      setLoading(true);
      fetch(`${API_BASE_URL}/workflow/edge-suggestions?from_node=${encodeURIComponent(edge.from || '')}&to_node=${encodeURIComponent(edge.to || '')}`)
        .then(res => res.json())
        .then(data => {
          setEdgeData(data);
          setLoading(false);
        })
        .catch(() => {
          // Fallback matching Design 6.4
          setEdgeData({
            edge_info: {
              from: fromNode?.title || edge.from || 'Source',
              to: toNode?.title || edge.to || 'Target',
              stream_name: 'raw stream',
              row_count: '1,420 rows',
            },
            fits_here: [
              {
                type: 'rules',
                title: 'AI rules',
                desc: 'Check records against plain-English policy',
                badge: 'Recommended',
                icon: 'Sparkles',
                compatible: true,
              },
              {
                type: 'router',
                title: 'Router · if / else',
                desc: 'Split stream by condition or confidence threshold',
                badge: null,
                icon: 'GitFork',
                compatible: true,
              },
              {
                type: 'hitl',
                title: 'Review · controller gate',
                desc: 'Hold ambiguous rows for human sign-off',
                badge: null,
                icon: 'UserCheck',
                compatible: true,
              },
            ],
            not_available_here: [
              {
                type: 'source',
                title: 'Source node',
                reason: 'Mid-stream inserts cannot create new source origins',
                compatible: false,
              },
              {
                type: 'target',
                title: 'Terminal sink',
                reason: 'Direct inserts cannot terminate downstream pipeline connections',
                compatible: false,
              },
            ],
          });
          setLoading(false);
        });
    }
  }, [isOpen, edge, fromNode, toNode]);

  if (!isOpen || !edge) return null;

  const fitsList = (edgeData?.fits_here || []).filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const notAvailableList = (edgeData?.not_available_here || []).filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div 
        className="w-[360px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Insert node between</span>
            </h4>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stream Context Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200/70 rounded-lg text-[11px] text-blue-900 font-medium mb-2.5">
            <span className="text-blue-500 font-mono text-xs">⊞</span>
            <span>On this edge:</span>
            <span className="font-semibold text-blue-700">raw stream</span>
            <span className="text-blue-400">·</span>
            <span className="font-mono text-[10px] text-blue-800 bg-blue-100/70 px-1.5 py-0.2 rounded font-semibold">
              {edgeData?.edge_info?.row_count || '1,420 rows'}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search nodes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Node Categories */}
        <div className="p-3 overflow-y-auto space-y-3 divide-y divide-slate-100 max-h-[380px]">
          {/* Fits Here */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              FITS HERE
            </div>
            <div className="space-y-1">
              {fitsList.map((node) => {
                const IconComponent = node.type === 'rules' ? Sparkles : node.type === 'router' ? GitFork : UserCheck;
                return (
                  <button
                    key={node.type}
                    onClick={() => {
                      if (onSelectNodeType) {
                        onSelectNodeType(node.type);
                        onClose();
                      }
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center flex-shrink-0 text-[#2D55F5] group-hover:bg-[#2D55F5] group-hover:text-white transition-colors">
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-[#2D55F5]">
                          {node.title}
                        </span>
                        {node.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 text-[#2D55F5]">
                            {node.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {node.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Not Available Here */}
          {notAvailableList.length > 0 && (
            <div className="pt-2.5 space-y-1.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                NOT AVAILABLE HERE
              </div>
              <div className="space-y-1">
                {notAvailableList.map((node) => (
                  <div
                    key={node.type}
                    className="p-2 rounded-lg border border-slate-150 bg-slate-50/70 opacity-60 flex items-start gap-2 cursor-not-allowed select-none"
                    title={node.reason}
                  >
                    <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500 text-xs">
                      <AlertCircle className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-slate-600 line-through">
                        {node.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.2">
                        {node.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Link to AI Drawer */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/80">
          <button
            onClick={() => {
              onClose();
              if (onOpenBuildWithAi) {
                onOpenBuildWithAi(`Insert logic between ${fromNode?.title || 'upstream'} and ${toNode?.title || 'downstream'}`);
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-[#2D55F5] hover:bg-blue-50/70 border border-blue-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Describe what you need instead →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
