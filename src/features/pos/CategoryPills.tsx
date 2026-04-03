import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setCategory } from './posSlice';

const CATEGORIES = ['All Items', 'Food', 'Drinks', 'Electronics', 'Bakery', 'Merchandise'];

const CategoryPills: React.FC = () => {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(state => state.pos.selectedCategory);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => dispatch(setCategory(cat))}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
            selected === cat
              ? 'bg-[#1B2B4B] text-white shadow-sm'
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
