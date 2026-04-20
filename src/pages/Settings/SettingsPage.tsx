import React, { useState } from 'react';
import TaxSettingsSection from '../../features/settings/sections/TaxSettingsSection';
import StoreSettingsSection from '../../features/settings/sections/StoreSettingsSection';
import PosSettingsSection from '../../features/settings/sections/PosSettingsSection';

type SettingsTab = 'tax' | 'store' | 'pos';

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'tax', label: 'Tax Configuration' },
  { id: 'store', label: 'Store Information' },
  { id: 'pos', label: 'POS Behavior' },
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('tax');

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted mt-1">Manage your store configuration</p>
      </div>

      {/* Content: sidebar tabs + form area */}
      <div className="flex gap-6">
        {/* Tab sidebar */}
        <nav className="w-56 flex-shrink-0 flex flex-col gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary rounded-lg px-4 py-2.5 text-sm font-medium w-full text-left'
                  : 'text-text-muted hover:text-text-primary hover:bg-gray-50 rounded-lg px-4 py-2.5 text-sm font-medium w-full text-left transition-colors'
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Section content */}
        <div className="flex-1">
          {activeTab === 'tax' && <TaxSettingsSection />}
          {activeTab === 'store' && <StoreSettingsSection />}
          {activeTab === 'pos' && <PosSettingsSection />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
