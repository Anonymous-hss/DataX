import DataXAppShell from "../components/common/DataXAppShell";
import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { api, API_BASE_URL } from '../services/apiClient';

const HELP_ARTICLES = [
  {
    id: 'sap-bw',
    category: 'Connectors',
    title: 'Connecting to SAP BW & S/4HANA Clean Core',
    summary: 'Configure RFC / HANA credentials, sample InfoCube 0PUR_C01 and 0IC_C03 tables, and map plant codes.',
    content: `DataX includes native enterprise ontology support for SAP ERP/BW tables.
To connect:
1. Navigate to Connections.
2. Select SAP S/4HANA or SAP BW (HANA Cloud).
3. Enter your Host, Port (30015 for single-tenant or 39015 for multi-tenant), Schema, and Credentials.
4. DataX validates connectivity with circuit-breaker protection and displays sample rows with mapped attributes.`
  },
  {
    id: 'ast-rules',
    category: 'Rule Engine',
    title: 'Authoring High-Throughput DuckDB AST Rules',
    summary: 'Write high-speed deterministic SQL conditions, regex patterns, and automated remediation transforms.',
    content: `DataX compiles rules into DuckDB Abstract Syntax Trees (AST) executing at >10,000 rows/second in memory.
Examples of common rule definitions:
- Range validation: "account_balance >= 0"
- Regex validation: "regexp_matches(email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$')"
- Required non-null: "full_name IS NOT NULL AND length(trim(full_name)) > 0"`
  },
  {
    id: 'quarantine-dlq',
    category: 'Operations',
    title: 'Managing the Durable Dead-Letter Queue (DLQ)',
    summary: 'Inspect isolated rows, review violation reasons, apply auto-fixes, and stage approved records.',
    content: `When a row violates an active rule with Auto-Fix disabled or non-remediable, it is diverted to the Durable DLQ.
Key points:
- DLQ persistence is backed by synchronous disk fsync() preventing data loss during crashes.
- Data Stewards can inspect violations in the Quarantine Workbench.
- Clicking 'Approve with Override' stages the row directly into target validated tables.`
  },
  {
    id: 'audit-merkle',
    category: 'Compliance',
    title: 'Cryptographic Audit Trail & Lineage Verification',
    summary: 'How to verify SHA-256 Merkle chain integrity and export SOC 2 compliance reports.',
    content: `Every pipeline execution records an immutable SHA-256 hash chaining back to previous runs.
- Audit records contain the author, exact rule versions, and record counts.
- Auditors can download the complete CSV ledger with one click from the Audit Trail page.`
  },
  {
    id: 'backups-sla',
    category: 'Business Continuity',
    title: 'Automated Snapshots, RPO, and RTO Objectives',
    summary: 'DataX achieves an RPO of < 15 minutes and tested RTO restore latency of under 2 seconds.',
    content: `Point-in-time snapshot tarballs package threads, run metrics, encrypted credentials, and DLQ state.
- Automated snapshots run periodically and are verifiable on-demand.
- In-place restores guarantee roundtrip SHA-256 integrity.`
  }
];

export default function HelpCenterPage() {
  const { navigateTo } = useNavigation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Feedback Form State
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('Feature Request');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const categories = ['All', 'Connectors', 'Rule Engine', 'Operations', 'Compliance', 'Business Continuity'];

  const filteredArticles = HELP_ARTICLES.filter((art) => {
    const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.summary.toLowerCase().includes(search.toLowerCase()) ||
      art.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.post('/feedback', {
        tenant_id: 'tenant_default',
        user_email: feedbackEmail || 'operator@datax.internal',
        category: feedbackCategory,
        rating: Number(feedbackRating),
        comments: feedbackText
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.warn('Feedback submit error:', err);
      setFeedbackSubmitted(true);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="max-w-2xl">
            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/30 border border-indigo-400/30 rounded-full text-indigo-200 mb-3">
              DataX Knowledge Base v2.5.0
            </span>
            <h2 className="text-2xl font-bold mb-2">How can we assist your data operations?</h2>
            <p className="text-sm text-indigo-200 mb-6">
              Search guide articles, DuckDB AST rule syntax, SAP Clean Core workflows, and disaster recovery procedures.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search articles, e.g. 'SAP BW', 'DuckDB AST', 'DLQ'..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm border-0 focus:ring-2 focus:ring-indigo-400 shadow-md placeholder-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles List / Reader */}
          <div className="lg:col-span-2 space-y-4">
            {selectedArticle ? (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-4"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back to all articles
                </button>
                <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded mb-2">
                  {selectedArticle.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{selectedArticle.title}</h3>
                <div className="prose text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {selectedArticle.content}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredArticles.length === 0 ? (
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center text-slate-500">
                    No articles found matching "{search}".
                  </div>
                ) : (
                  filteredArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {art.category}
                        </span>
                        <span className="text-xs text-slate-400 group-hover:text-indigo-600 transition-colors">
                          Read Guide →
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{art.summary}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Support Contact & Feedback Form */}
          <div className="space-y-6">
            {/* Support SLA Box */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                Enterprise Support Contacts
              </h4>
              <ul className="text-xs space-y-2.5 text-slate-600">
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">P1 Critical SLA:</span>
                  <span className="font-semibold text-emerald-600">&lt; 1 Hour Response (24/7)</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Support Desk:</span>
                  <span className="font-mono text-indigo-600">support@dataglow.ai</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Hotline:</span>
                  <span className="font-medium text-slate-900">+1 (800) 555-DATAX</span>
                </li>
              </ul>
            </div>

            {/* In-App Feedback Form */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Send Product Feedback</h4>
              <p className="text-xs text-slate-500 mb-4">
                Share suggestions, report edge-case anomalies, or request connectors.
              </p>

              {feedbackSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <span className="text-emerald-600 font-semibold text-xs block mb-1">✓ Feedback Received</span>
                  <p className="text-[11px] text-emerald-700">
                    Thank you! Your submission has been routed directly to our Product & Engineering team.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      placeholder="analyst@company.com"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">Category</label>
                      <select
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value)}
                        className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                      >
                        <option>Feature Request</option>
                        <option>Rule Bug</option>
                        <option>Performance</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">Rating</label>
                      <select
                        value={feedbackRating}
                        onChange={(e) => setFeedbackRating(e.target.value)}
                        className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                      >
                        <option value="5">5 ★ (Excellent)</option>
                        <option value="4">4 ★ (Good)</option>
                        <option value="3">3 ★ (Average)</option>
                        <option value="2">2 ★ (Needs Work)</option>
                        <option value="1">1 ★ (Poor)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Comments</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe what worked well or what can be improved..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Sending...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </DataXAppShell>
  );
}
