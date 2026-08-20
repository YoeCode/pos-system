import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setCategory } from './posSlice';
import { selectCategories } from '../settings/settingsSlice';

const CategoryPills: React.FC = () => {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(state => state.pos.selectedCategory);
  const categories = useAppSelector(selectCategories);
  const allCategories = ['All Items', ...categories];

  return (
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
  );
};

export default CategoryPills;
