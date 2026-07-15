import React from 'react';
import type { DataSource } from '../types';

interface BadgeProps {
  source: DataSource;
}

const Badge: React.FC<BadgeProps> = ({ source }) => {
  const colors: Record<DataSource, string> = {
    CRM: 'bg-blue-100 text-blue-700 border-blue-200',
    CONFIG: 'bg-purple-100 text-purple-700 border-purple-200',
    MANUAL: 'bg-orange-100 text-orange-700 border-orange-200',
    CALC: 'bg-green-100 text-green-700 border-green-200',
    MCR: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'MPF-UPLOAD': 'bg-pink-100 text-pink-700 border-pink-200',
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ml-1 whitespace-nowrap ${colors[source]}`}>
      {source}
    </span>
  );
};

export default Badge;
