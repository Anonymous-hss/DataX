import React, { useState } from 'react';
import { Link } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import DataXUserMenu from '../components/common/DataXUserMenu';
import { DataXLogo } from './ThreadsPage';

export default function SettingsPage({ onSwitchToMarketing }) {
  const [activeTab, setActiveTab] = useState('general');
  const [cronExpression, setCronExpression] = useState('0 */6 * * *');
  const [cronEnabled, setCronEnabled] = useState(true);
  const [notificationChannel, setNotificationChannel] = useState('email');
  const [emailAlerts, setEmailAlerts] = useState('compliance-team@aavil.com');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/X00');
  const [savedBanner, setSavedBanner] = useState(false);

  const [teamMembers, setTeamMembers] = useState([
    { id: 'usr_1', name: 'Harshal Sawatkar', email: 'harshal@aavil.com', role: 'Tenant Admin', status: 'Active' },
    { id: 'usr_2', name: 'Sarah Chen', email: 's.chen@aavil.com', role: 'Data Steward', status: 'Active' },
    { id: 'usr_3', name: 'Marcus Vance', email: 'm.vance@aavil.com', role: 'Security Auditor', status: 'Active' }
  ]);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Data Steward');

  const handleSave = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setTeamMembers(prev => [
      ...prev,
      {
        id: `usr_${Date.now()}`,
        name: newMemberEmail.split('@')[0],
        email: newMemberEmail.trim(),
        role: newMemberRole,
        status: 'Invited'
      }
    ]);
    setNewMemberEmail('');
  };

  const handleRemoveMember = (id) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased">
      {/* Top Universal Navbar */}
      <header className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <Link to="threads" className="flex items-center gap-2.5">
              <DataXLogo size={32} />
              <span className="font-bold text-[#0A0F1F] tracking-tight text-[18px]">DataX</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1.5">
              <Link to="workflows" className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5">
                Workflows
              </Link>
              <Link to="templates" className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5">
                Templates
              </Link>
              <Link to="connections" className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5">
                Connections
              </Link>
              <Link to="quarantine" className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5">
                Quarantine
              </Link>
              <Link to="audit" className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5">
                Audit Trail
              </Link>
              <Link to="settings" className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#EEF2FF] text-[#2D55F5] flex items-center gap-1.5">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <DataXUserMenu onSwitchToMarketing={onSwitchToMarketing} />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1360px] mx-auto px-6 py-8">
        {savedBanner && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium flex items-center justify-between shadow-sm">
            <span>Settings successfully persisted to encrypted vault.</span>
            <button onClick={() => setSavedBanner(false)} className="text-xs font-bold underline">Dismiss</button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0A0F1F] tracking-tight">
            Platform Settings & Administration
          </h1>
          <p className="text-sm text-[#5F6678] mt-1">
            Manage organization credentials, role-based access control, automated pipeline schedules, and alert webhooks.
          </p>
        </div>

        {/* Settings Layout with Sidebar Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Tabs Nav */}
          <div className="space-y-1">
            {[
              { id: 'general', label: 'Organization & Profile', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { id: 'scheduling', label: 'Pipeline Schedules (Cron)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'alerts', label: 'Alerts & Webhooks', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
              { id: 'team', label: 'Team & RBAC Roles', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              { id: 'apikeys', label: 'API Keys & Secrets Vault', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#2D55F5] text-white shadow-sm'
                    : 'text-[#5F6678] hover:bg-white hover:text-[#0A0F1F]'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panes */}
          <div className="md:col-span-3">
            {activeTab === 'general' && (
              <div className="bg-white border border-[#E3E6EE] rounded-2xl p-6 shadow-2xs space-y-6">
                <h3 className="text-base font-bold text-[#0A0F1F]">Organization & Profile</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                    <input type="text" readOnly defaultValue="AAVIL Inc (Enterprise)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant ID</label>
                    <input type="text" readOnly defaultValue="tenant_aavil_prod_01" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Default Data Residency</label>
                    <select defaultValue="us-east-2" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                      <option value="us-east-2">AWS US-East-2 (Ohio)</option>
                      <option value="eu-central-1">AWS EU-Central-1 (Frankfurt)</option>
                      <option value="ap-south-1">Azure India Central (Pune)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Environment Tier</label>
                    <span className="inline-block mt-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                      Production Enterprise v2.5.0
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSave} className="px-5 py-2 bg-[#2D55F5] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-2xs transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'scheduling' && (
              <div className="bg-white border border-[#E3E6EE] rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0A0F1F]">Pipeline Automated Scheduling</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Run data cleaning and SAP reconciliation on a recurring cron schedule.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={cronEnabled} onChange={(e) => setCronEnabled(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D55F5]"></div>
                  </label>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">Cron Expression (5-field UTC)</label>
                  <input
                    type="text"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Current schedule: Every 6 hours at minute 0 (00:00, 06:00, 12:00, 18:00 UTC)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onClick={() => setCronExpression('0 */1 * * *')} className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 text-left">
                    Hourly (0 * * * *)
                  </button>
                  <button onClick={() => setCronExpression('0 0 * * *')} className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 text-left">
                    Daily at Midnight (0 0 * * *)
                  </button>
                  <button onClick={() => setCronExpression('0 8 * * 1')} className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 text-left">
                    Weekly Mon 08:00 UTC
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSave} className="px-5 py-2 bg-[#2D55F5] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-2xs transition-all">
                    Update Schedule
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="bg-white border border-[#E3E6EE] rounded-2xl p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#0A0F1F]">Alert Channels & Incident Escalation</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Receive immediate notifications on quarantine violations or pipeline circuit breaker trips.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Alert Recipients (comma-separated)</label>
                    <input
                      type="text"
                      value={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Slack Incoming Webhook URL</label>
                    <input
                      type="text"
                      value={slackWebhook}
                      onChange={(e) => setSlackWebhook(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSave} className="px-5 py-2 bg-[#2D55F5] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-2xs transition-all">
                    Save Notification Channels
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white border border-[#E3E6EE] rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0A0F1F]">Team & Role-Based Access Control (RBAC)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage permissions for data stewards, pipeline engineers, and auditors.</p>
                  </div>
                </div>

                {/* Invite member form */}
                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="teammate@company.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                  >
                    <option value="Tenant Admin">Tenant Admin</option>
                    <option value="Data Steward">Data Steward</option>
                    <option value="Security Auditor">Security Auditor</option>
                    <option value="Read-only Viewer">Read-only Viewer</option>
                  </select>
                  <button type="submit" className="px-4 py-2 bg-[#2D55F5] text-white text-xs font-bold rounded-lg shadow-2xs">
                    Invite Member
                  </button>
                </form>

                {/* Team Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Name & Email</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teamMembers.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-900">{m.name}</p>
                            <p className="text-[11px] text-slate-400">{m.email}</p>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{m.role}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {m.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button onClick={() => handleRemoveMember(m.id)} className="text-red-500 hover:text-red-700 font-semibold text-[11px]">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'apikeys' && (
              <div className="bg-white border border-[#E3E6EE] rounded-2xl p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#0A0F1F]">API Keys & Secrets Vault</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Automated pipelines authenticate with cryptographically signed bearer tokens.</p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Production Secret API Key</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">ACTIVE</span>
                  </div>
                  <p className="text-emerald-400 text-sm font-bold tracking-wider">
                    dx_live_99f81a7b02bc4219ef821a0029b
                  </p>
                  <p className="text-[10px] text-slate-400">Created 2026-10-23 • AES-128 Fernet Hardware Encrypted</p>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={handleSave} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all">
                    Roll & Rotate API Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
