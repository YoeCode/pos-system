import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setCategory, setSubcategory, selectSelectedCategory, selectSelectedSubcategory } from './posSlice';
import { selectCategories, selectCategoryGroups } from '../settings/settingsSlice';
import { useI18n } from '../../i18n/useI18n';

const CategoryPills: React.FC = () => {
  const dispatch = useAppDispatch();
  const t = useI18n();
  const selected = useAppSelector(selectSelectedCategory);
  const selectedSubcategory = useAppSelector(selectSelectedSubcategory);
  const categories = useAppSelector(selectCategories);
  const categoryGroups = useAppSelector(selectCategoryGroups);
  const allCategories = ['All Items', ...categories];

  const activeGroup = categoryGroups.find(g => g.name === selected);
  const subcategories = activeGroup?.subcategories ?? [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide snap-x snap-mandatory">
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => dispatch(setCategory(cat))}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 snap-start ${
              selected === cat
                ? 'bg-dark-navy text-white shadow-sm'
                : 'bg-white border border-border text-text-muted hover:border-primary hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {subcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-1 -mx-1 scrollbar-hide snap-x snap-mandatory">
          <button
            onClick={() => dispatch(setSubcategory(null))}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-150 snap-start ${
              selectedSubcategory === null
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-border text-text-muted hover:border-primary hover:text-text-primary'
            }`}
          >
            {t.common.all}
          </button>
          {subcategories.map(sub => (
            <button
              key={sub}
              onClick={() => dispatch(setSubcategory(sub))}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-150 snap-start ${
                selectedSubcategory === sub
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-border text-text-muted hover:border-primary hover:text-text-primary'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPills;
