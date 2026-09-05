import React from 'react';
import type { Employee } from '../../types';
import Toggle from '../../components/ui/Toggle';
import { useI18n } from '../../i18n/useI18n';

interface PublishToggleProps {
  isEditing: boolean;
  publishedOnline: boolean;
  onToggle: (value: boolean) => void;
  isPublishUnlocked: boolean;
  authorizedBy: Employee | null;
  onRequestAuth: () => void;
}

const PublishToggle: React.FC<PublishToggleProps> = ({
  isEditing,
  publishedOnline,
  onToggle,
  isPublishUnlocked,
  authorizedBy,
  onRequestAuth,
}) => {
  const t = useI18n();

  return (
    <div className="p-3 rounded-lg border border-border bg-background">
      {isEditing ? (
        <>
          {isPublishUnlocked && authorizedBy && (
            <p className="text-xs text-green-600 flex items-center gap-1 mb-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.products.detail.authorizedBy.replace('{{name}}', authorizedBy.name)}
            </p>
          )}
          {isPublishUnlocked ? (
            <Toggle
              checked={publishedOnline}
              onChange={onToggle}
              label={t.products.detail.publishToOnline}
              description={t.products.detail.publishDescription}
            />
          ) : (
            <button
              onClick={onRequestAuth}
              title={t.products.detail.unlockPublishDescription}
              className="w-full flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${publishedOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-text-primary">
                  {publishedOnline ? t.products.detail.published : t.products.detail.notPublished}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t.products.detail.unlock}
              </span>
            </button>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${publishedOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-text-primary">
            {publishedOnline ? t.products.detail.published : t.products.detail.notPublished}
          </span>
        </div>
      )}
    </div>
  );
};

export default PublishToggle;
