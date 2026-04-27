import React, { useState } from 'react';
import TaxSettingsSection from '../../features/settings/sections/TaxSettingsSection';
import StoreSettingsSection from '../../features/settings/sections/StoreSettingsSection';
import PosSettingsSection from '../../features/settings/sections/PosSettingsSection';
import LanguageSettingsSection from '../../features/settings/sections/LanguageSettingsSection';
import { useI18n } from '../../i18n/I18nProvider';

type SettingsTab = 'tax' | 'store' | 'pos' | 'language';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('tax');
  const t = useI18n();

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'tax', label: t.settings.tax },
    { id: 'store', label: t.settings.store },
    { id: 'pos', label: t.settings.pos },
    { id: 'language', label: t.settings.language },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t.settings.title}</h1>
        <p className="text-text-muted mt-1">{t.settings.title}</p>
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
          {activeTab === 'language' && <LanguageSettingsSection />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
