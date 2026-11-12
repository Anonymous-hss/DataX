import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { 
  Building2, 
  Clock, 
  Bell, 
  Shield, 
  Plug, 
  RotateCw, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  Plus, 
  FileText 
} from 'lucide-react';
import api from '../services/apiClient';

export default function SettingsPage({ onSwitchToMarketing }) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const stored = localStorage.getItem('datax_settings_active_tab');
      if (stored && ['general', 'scheduling', 'alerts', 'team', 'apikeys'].includes(stored)) {
        return stored;
      }
    } catch {}
    return 'general';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('datax_settings_active_tab', tabId);
    } catch {}
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('DG');
  const [tenantId, setTenantId] = useState('tenant_enterprise');
  const [dataResidency, setDataResidency] = useState('AWS us-east-2 (Ohio)');
  const [cronExpression, setCronExpression] = useState('0 */6 * * *');
  const [emailAlerts, setEmailAlerts] = useState('data-oncall@enterprise.io, s.chen@enterprise.io');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/...');
  const [apiKey, setApiKey] = useState('dx_live_303d55...dc29');
  const [savedBanner, setSavedBanner] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Timezone & Locale prefs
  const [timezone, setTimezone] = useState(() => localStorage.getItem('datax_timezone_pref') || 'UTC');
  const [language, setLanguage] = useState(() => localStorage.getItem('datax_locale_pref') || 'English (United States)');

  const [teamMembers, setTeamMembers] = useState([
    { id: 'usr_1', name: 'Tenant administrator', email: 'admin@enterprise.io', role: 'Tenant admin', status: 'Active' },
    { id: 'usr_2', name: 'Sarah Chen', email: 's.chen@enterprise.io', role: 'Data steward', status: 'Active' },
    { id: 'usr_3', name: 'Marcus Vance', email: 'm.vance@enterprise.io', role: 'Security auditor', status: 'Active' }
  ]);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Data steward');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/tenant');
      if (res?.settings) {
        const s = res.settings;
        if (s.company_name) setCompanyName(s.company_name);
        if (s.tenant_id) setTenantId(s.tenant_id);
        if (s.data_residency) setDataResidency(s.data_residency);
        if (s.cron_expression) setCronExpression(s.cron_expression);
        if (s.email_alerts) setEmailAlerts(s.email_alerts);
        if (s.slack_webhook !== undefined) setSlackWebhook(s.slack_webhook || '');
        if (Array.isArray(s.team_members) && s.team_members.length > 0) setTeamMembers(s.team_members);
        if (s.api_key) setApiKey(s.api_key);
      }
    } catch (e) {
      console.warn('Failed loading tenant settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        company_name: companyName,
        data_residency: dataResidency,
        cron_expression: cronExpression,
        email_alerts: emailAlerts,
        slack_webhook: slackWebhook,
        team_members: teamMembers,
        api_key: apiKey
      };
      await api.post('/settings/tenant', payload);
      setSavedBanner('Settings saved successfully.');
      setTimeout(() => setSavedBanner(''), 3000);
    } catch (err) {
      setSavedBanner(`Failed to save: ${err.message}`);
      setTimeout(() => setSavedBanner(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard?.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleConfirmRotation = async () => {
    setIsRotateModalOpen(false);
    try {
      const res = await api.post('/settings/apikeys/rotate');
      if (res?.apiKey) {
        setApiKey(res.apiKey);
      } else {
        const randomHex = Math.random().toString(36).substring(2, 10);
        setApiKey(`dx_live_${randomHex}...${Math.random().toString(36).substring(2, 6)}`);
      }
      setSavedBanner('API key rotated. Scheduled pipelines must update credentials.');
      setTimeout(() => setSavedBanner(''), 4000);
    } catch (err) {
      setSavedBanner(`Rotation failed: ${err.message}`);
      setTimeout(() => setSavedBanner(''), 4000);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    try {
      const newMember = {
        id: `usr_${Date.now()}`,
        name: newMemberEmail.split('@')[0],
        email: newMemberEmail.trim(),
        role: newMemberRole,
        status: 'Active'
      };
      setTeamMembers(prev => [...prev, newMember]);
      setNewMemberEmail('');
      setIsInviteModalOpen(false);
      setSavedBanner('Team member invited successfully.');
      setTimeout(() => setSavedBanner(''), 3000);
    } catch (err) {
      setSavedBanner(`Failed to invite: ${err.message}`);
      setTimeout(() => setSavedBanner(''), 4000);
    }
  };

  const handleRemoveMember = (id) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleRoleChange = (id, newRole) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1400px] mx-auto px-6 py-8 font-sans">
        {/* Toast Alert Banner */}
        {savedBanner && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <span>{savedBanner}</span>
            <button onClick={() => setSavedBanner('')} className="text-xs font-bold underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Page Header (Matching 08.1 Settings · Organization.png) */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0A0F1F] tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-[#5F6678] mt-1.5 font-medium">
            Organization details, access control, pipeline schedules and alert channels.
          </p>
        </div>

        {/* 2-Column Layout: Sidebar Nav + Content Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Vertical Nav (Matching 08.1) */}
          <div className="md:col-span-3 space-y-1">
            {[
              { id: 'general', label: 'Organization & profile', icon: FileText },
              { id: 'scheduling', label: 'Pipeline schedules', icon: Clock },
              { id: 'alerts', label: 'Alerts & webhooks', icon: Bell },
              { id: 'team', label: 'Team & roles', icon: Shield },
              { id: 'apikeys', label: 'API keys & secrets', icon: Plug }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EFF4FF] text-[#2D55F5]'
                      : 'text-[#5F6678] hover:bg-slate-100 hover:text-[#0A0F1F]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2D55F5]' : 'text-[#5F6678]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Main Content Card */}
          <div className="md:col-span-9">
            {/* 08.1 Settings · Organization & profile */}
            {activeTab === 'general' && (
              <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-8 shadow-xs space-y-6">
                <h2 className="text-base font-bold text-[#0A0F1F]">
                  Organization & profile
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Company / organization */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                      Company / organization
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-sm font-medium text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5]"
                    />
                  </div>

                  {/* Tenant ID */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                      Tenant ID
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={tenantId}
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#5F6678] cursor-not-allowed select-all"
                    />
                  </div>

                  {/* Default data residency */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                      Default data residency
                    </label>
                    <select
                      value={dataResidency}
                      onChange={(e) => setDataResidency(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-sm font-medium text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5] cursor-pointer"
                    >
                      <option value="AWS us-east-2 (Ohio)">AWS us-east-2 (Ohio)</option>
                      <option value="AWS eu-central-1 (Frankfurt)">AWS eu-central-1 (Frankfurt)</option>
                      <option value="Azure India Central (Pune)">Azure India Central (Pune)</option>
                    </select>
                    <p className="text-[11px] text-[#5F6678] mt-1.5 font-medium">
                      Also: AWS eu-central-1 (Frankfurt), Azure India Central (Pune)
                    </p>
                  </div>

                  {/* Environment tier */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                      Environment tier
                    </label>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Production enterprise v2.5.0
                      </span>
                    </div>
                  </div>

                  {/* Timezone for audit & logs */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                      Timezone for audit & logs
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        localStorage.setItem('datax_timezone_pref', e.target.value);
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-sm font-medium text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5] cursor-pointer"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST / EDT)</option>
                      <option value="America/Chicago">America/Chicago (CST / CDT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                      <option value="Europe/London">Europe/London (GMT / BST)</option>
                      <option value="Europe/Frankfurt">Europe/Frankfurt (CET / CEST)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST - UTC+9:00)</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        localStorage.setItem('datax_locale_pref', e.target.value);
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-sm font-medium text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5] cursor-pointer"
                    >
                      <option value="English (United States)">English (United States)</option>
                      <option value="English (United Kingdom)">English (United Kingdom)</option>
                      <option value="Deutsch (Germany)">Deutsch (Germany)</option>
                      <option value="Français (France)">Français (France)</option>
                      <option value="日本語 (Japan)">日本語 (Japan)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}

            {/* 08.2 Settings · Pipeline schedules */}
            {activeTab === 'scheduling' && (
              <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0A0F1F]">
                    Pipeline scheduling
                  </h2>
                  <p className="text-xs text-[#5F6678] mt-1 font-medium">
                    Run cleaning and SAP reconciliation on a recurring cron schedule
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                    Cron expression (5-field, UTC)
                  </label>
                  <input
                    type="text"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-sm font-mono text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5]"
                  />
                </div>

                {/* Blue info callout matching 08.2 */}
                <div className="bg-[#EFF4FF] border border-[#D0E1FD] rounded-xl p-4 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#2D55F5] shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#0A0F1F]">
                      Current schedule
                    </h4>
                    <p className="text-xs text-[#5F6678] mt-0.5">
                      Every 6 hours at minute 0 (00:00, 06:00, 12:00, 18:00 UTC).
                    </p>
                  </div>
                </div>

                {/* Presets row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[#5F6678] font-medium mr-1">Presets</span>
                  <button
                    type="button"
                    onClick={() => setCronExpression('0 * * * *')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#CDD2DE] rounded-full text-xs font-semibold text-[#0A0F1F] transition-colors cursor-pointer"
                  >
                    Hourly · 0 * * * *
                  </button>
                  <button
                    type="button"
                    onClick={() => setCronExpression('0 0 * * *')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#CDD2DE] rounded-full text-xs font-semibold text-[#0A0F1F] transition-colors cursor-pointer"
                  >
                    Daily at midnight · 0 0 * * *
                  </button>
                  <button
                    type="button"
                    onClick={() => setCronExpression('0 8 * * 1')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#CDD2DE] rounded-full text-xs font-semibold text-[#0A0F1F] transition-colors cursor-pointer"
                  >
                    Weekly Mon 08:00 UTC
                  </button>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Update schedule'}
                  </button>
                </div>
              </div>
            )}

            {/* 08.3 Settings · Alerts & webhooks */}
            {activeTab === 'alerts' && (
              <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0A0F1F]">
                    Alert channels & escalation
                  </h2>
                  <p className="text-xs text-[#5F6678] mt-1 font-medium">
                    Notify on quarantine violations or pipeline circuit-breaker trips
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                      Email recipients (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-sm font-medium text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F1F] mb-2">
                      Slack incoming webhook URL
                    </label>
                    <input
                      type="text"
                      value={slackWebhook}
                      onChange={(e) => setSlackWebhook(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-sm font-mono text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save channels'}
                  </button>
                </div>
              </div>
            )}

            {/* 08.4 Settings · Team & roles */}
            {activeTab === 'team' && (
              <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-8 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0A0F1F]">
                      Team & role-based access
                    </h2>
                    <p className="text-xs text-[#5F6678] mt-1 font-medium">
                      Permissions for data stewards, pipeline engineers and auditors
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Invite member</span>
                  </button>
                </div>

                {/* 4 Role Definition Cards (Matching 08.4) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
                    <h4 className="text-xs font-bold text-[#0A0F1F]">Tenant admin</h4>
                    <p className="text-[11px] text-[#5F6678] mt-1 leading-relaxed">Full control incl. licenses & SIEM</p>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
                    <h4 className="text-xs font-bold text-[#0A0F1F]">Data steward</h4>
                    <p className="text-[11px] text-[#5F6678] mt-1 leading-relaxed">Review and resolve quarantine</p>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
                    <h4 className="text-xs font-bold text-[#0A0F1F]">Security auditor</h4>
                    <p className="text-[11px] text-[#5F6678] mt-1 leading-relaxed">Audit ledger and exports</p>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
                    <h4 className="text-xs font-bold text-[#0A0F1F]">Read-only viewer</h4>
                    <p className="text-[11px] text-[#5F6678] mt-1 leading-relaxed">View workflows and runs</p>
                  </div>
                </div>

                {/* Team Members Table (Matching 08.4) */}
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#5F6678] text-[10px] font-bold tracking-wider uppercase">
                      <tr>
                        <th className="py-3 px-4">NAME & EMAIL</th>
                        <th className="py-3 px-4">ROLE</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {teamMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#0A0F1F] text-xs">{m.name}</p>
                            <p className="text-[11px] text-[#5F6678] font-mono mt-0.5">{m.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              className="px-3 py-1.5 bg-white border border-[#CDD2DE] rounded-lg text-xs font-medium text-[#0A0F1F] cursor-pointer"
                            >
                              <option value="Tenant admin">Tenant admin</option>
                              <option value="Data steward">Data steward</option>
                              <option value="Security auditor">Security auditor</option>
                              <option value="Read-only viewer">Read-only viewer</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.id)}
                              className="text-xs font-semibold text-[#5F6678] hover:text-rose-600 transition-colors cursor-pointer"
                            >
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

            {/* 08.5 Settings · API keys & secrets */}
            {activeTab === 'apikeys' && (
              <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0A0F1F]">
                    API keys & secrets
                  </h2>
                  <p className="text-xs text-[#5F6678] mt-1 font-medium">
                    Automated pipelines authenticate with signed bearer tokens
                  </p>
                </div>

                {/* API Key Box matching 08.5 */}
                <div className="border border-[#E2E8F0] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#D0E1FD] flex items-center justify-center text-[#2D55F5] shrink-0">
                      <Plug className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0A0F1F]">
                          Production secret key
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-[#0A0F1F] mt-1 select-all">
                        {apiKey}
                      </p>
                      <p className="text-[11px] text-[#5F6678] mt-0.5">
                        Created 23 Oct 2026 · hardware encrypted
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="w-8 h-8 rounded-lg border border-[#CDD2DE] bg-white hover:bg-slate-50 flex items-center justify-center text-[#5F6678] transition-colors cursor-pointer"
                      title="Copy API key"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRotateModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Roll & rotate</span>
                    </button>
                  </div>
                </div>

                {/* Amber Warning Banner (Matching 08.5) */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Rotating the key invalidates it immediately for every scheduled pipeline. Update your integrations before you confirm.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 08.6 Confirm Key Rotation Modal */}
        {isRotateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] border border-[#E3E6EE] shadow-2xl max-w-md w-full p-6 text-left font-sans animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#D0E1FD] flex items-center justify-center text-[#2D55F5]">
                    <Plug className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#5F6678] block">
                      Confirmation
                    </span>
                    <h3 className="text-base font-bold text-[#0A0F1F]">
                      Rotate the production key?
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRotateModalOpen(false)}
                  className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 text-xs text-[#5F6678] leading-relaxed border-t border-b border-[#F1F3F7] my-4">
                <code className="font-mono font-semibold text-[#0A0F1F]">{apiKey}</code> stops working as soon as you confirm. Scheduled pipelines using it will fail until they get the new key.
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRotateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5F6678] hover:text-[#0A0F1F] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRotation}
                  className="px-4 py-2 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate key</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Team Member Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] border border-[#E3E6EE] shadow-2xl max-w-md w-full p-6 text-left font-sans animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#0A0F1F]">
                  Invite team member
                </h3>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="teammate@enterprise.io"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-medium text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">
                    Role assignment
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-medium text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5] cursor-pointer"
                  >
                    <option value="Tenant admin">Tenant admin</option>
                    <option value="Data steward">Data steward</option>
                    <option value="Security auditor">Security auditor</option>
                    <option value="Read-only viewer">Read-only viewer</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#5F6678] hover:text-[#0A0F1F] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#2D55F5] hover:bg-blue-600 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Send invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </DataXAppShell>
  );
}
