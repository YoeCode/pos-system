import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  selectLoyaltySettings,
  updateLoyaltySettings,
  resetLoyaltySettings,
} from '../settingsSlice';
import Button from '../../../components/ui/Button';
import Toggle from '../../../components/ui/Toggle';
import type { LoyaltyTier, LoyaltyTierConfig } from '../../../types';

const TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

const LoyaltySettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const reduxLoyalty = useAppSelector(selectLoyaltySettings);

  const [enabled, setEnabled] = useState(reduxLoyalty.enabled);
  const [pointsPerEuro, setPointsPerEuro] = useState(String(reduxLoyalty.pointsPerEuro));
  const [tiers, setTiers] = useState<LoyaltyTierConfig[]>(reduxLoyalty.tiers);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setEnabled(reduxLoyalty.enabled);
    setPointsPerEuro(String(reduxLoyalty.pointsPerEuro));
    setTiers(reduxLoyalty.tiers);
  }, [reduxLoyalty]);

  const handleTierChange = (
    tier: LoyaltyTier,
    field: 'threshold' | 'discountPct',
    rawValue: string
  ) => {
    setTiers(prev =>
      prev.map(t => {
        if (t.tier !== tier) return t;
        if (field === 'threshold') {
          return { ...t, threshold: parseInt(rawValue, 10) || 0 };
        }
        return { ...t, discountPct: parseFloat(rawValue) / 100 || 0 };
      })
    );
  };

  const handleSave = () => {
    dispatch(
      updateLoyaltySettings({
        enabled,
        pointsPerEuro: parseFloat(pointsPerEuro) || 1,
        tiers,
      })
    );
    setSavedFeedback(true);
  };

  const handleReset = () => {
    dispatch(resetLoyaltySettings());
  };

  useEffect(() => {
    if (savedFeedback) {
      const timer = setTimeout(() => setSavedFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [savedFeedback]);

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Loyalty Program</h2>
        <p className="text-xs text-text-muted mt-0.5">Configure tiers, points, and discounts</p>
      </div>

      <div className="p-4 rounded-xl border border-border bg-background">
        <Toggle
          label="Enable Loyalty Program"
          description="Award points and apply tier discounts at checkout"
          checked={enabled}
          onChange={setEnabled}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Points per Euro</label>
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={pointsPerEuro}
          onChange={e => setPointsPerEuro(e.target.value)}
          className="w-40 px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Tiers</p>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Tier</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Min Points</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Discount %</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map(tierConfig => (
                <tr key={tierConfig.tier} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">
                    {TIER_LABELS[tierConfig.tier]}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={tierConfig.threshold}
                      onChange={e => handleTierChange(tierConfig.tier, 'threshold', e.target.value)}
                      className="w-24 px-2.5 py-1.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative w-24">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={(tierConfig.discountPct * 100).toFixed(1)}
                        onChange={e => handleTierChange(tierConfig.tier, 'discountPct', e.target.value)}
                        className="w-full pr-6 pl-2.5 py-1.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-xs">%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-text-muted hover:text-error underline"
        >
          Reset to Defaults
        </button>

        <div className="flex items-center gap-3">
          {savedFeedback && (
            <span className="text-xs text-green-600 font-medium">Saved</span>
          )}
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoyaltySettingsSection;
