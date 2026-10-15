import React, { useState } from 'react';
import { Link } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import Segmented from '../components/ui/Segmented';
import Checkbox from '../components/ui/Checkbox';
import IconButton from '../components/ui/IconButton';
import Logo from '../components/icons/Logo';
import {
  IconSearch,
  IconArrowLeft,
  IconSparkles,
} from '../components/icons/NavIcons';
import {
  IconPlay,
  IconPlus,
} from '../components/icons/ActionIcons';

export default function RulesPage() {
  const { activeRules, toggleRule, addRule } = useRuleEngine();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCond, setNewRuleCond] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRules = activeRules.filter((r) => {
    if (filter === 'active' && !r.active) return false;
    if (filter === 'inactive' && r.active) return false;
    if (
      search.trim() &&
      !r.name.toLowerCase().includes(search.toLowerCase()) &&
      !r.condition.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const handleCreateRule = (e) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleCond.trim()) return;
    addRule({
      name: newRuleName.trim(),
      condition: newRuleCond.trim(),
      desc: 'User custom dynamic rule',
      severity: 'CRITICAL',
    });
    setNewRuleName('');
    setNewRuleCond('');
    setShowAddModal(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 font-sans">
      <header className="bg-white border-b border-[#E3E6EE] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="threads" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="font-bold text-[#0A0F1F] tracking-tight text-lg">DataX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="connect-target">
              <Button variant="secondary" size="md">
                Target Setup
              </Button>
            </Link>
            <Link to="running-dry-run">
              <Button variant="primary" size="md">
                <IconPlay className="mr-1 inline-block" filled /> Run Simulation
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="threads" className="text-xs font-medium text-[#2D55F5] hover:underline flex items-center gap-1 mb-2">
            <IconArrowLeft size={14} color="#2D55F5" /> Back to Threads
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0A0F1F] tracking-tight">Rules Engine</h1>
            <Tag variant="success">{activeRules.filter((r) => r.active).length} Active Rules</Tag>
          </div>
          <p className="text-sm text-[#5F6678] mt-1">
            Pipeline: <strong className="text-[#0A0F1F]">SAP BW → S/4HANA Clean Core (TH-0842)</strong>
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowAddModal(true)}>
          <IconPlus className="mr-1 inline-block" /> Add Custom Rule
        </Button>
      </div>

      <div className="bg-white border border-[#E3E6EE] rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Segmented
            options={[
              { label: 'All Rules', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Disabled', value: 'inactive' },
            ]}
            value={filter}
            onChange={setFilter}
          />

          <div className="w-full sm:w-72">
            <Input
              icon={<IconSearch size={16} />}
              placeholder="Search rule name or syntax..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="border border-[#E3E6EE] rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F6FA] text-xs font-semibold text-[#5F6678] border-b border-[#E3E6EE]">
              <tr>
                <th className="py-3 px-4 w-12">Enable</th>
                <th className="py-3 px-4">Rule ID & Name</th>
                <th className="py-3 px-4">Logic Condition Expression</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Pass Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6EE]">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#F9FAFC] transition-colors">
                  <td className="py-3.5 px-4 align-top">
                    <Checkbox checked={rule.active} onChange={() => toggleRule(rule.id)} />
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-medium text-[#0A0F1F]">{rule.name}</div>
                    <div className="text-xs text-[#5F6678] mt-0.5">{rule.desc}</div>
                    <span className="text-[11px] font-mono text-[#A6ADC2]">{rule.id}</span>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <code className="text-xs font-mono bg-[#EDEFF5] text-[#2D55F5] px-2 py-1 rounded inline-block max-w-md">
                      {rule.condition}
                    </code>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <Tag variant={rule.severity === 'CRITICAL' ? 'warning' : 'primary'}>
                      {rule.severity}
                    </Tag>
                  </td>
                  <td className="py-3.5 px-4 align-top text-xs font-semibold text-[#127A52]">
                    {rule.passRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#0A0F1F]">Add Custom Rule</h3>
            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Rule Name</label>
              <Input
                placeholder="e.g. Mandatory Material Code"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Condition Expression</label>
              <Input
                placeholder="e.g. len(MATERIAL_ID) > 3"
                value={newRuleCond}
                onChange={(e) => setNewRuleCond(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleCreateRule}>
                Save Rule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
