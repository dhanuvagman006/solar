import React from 'react';

const LoadingSkeleton = ({ count = 1, type = 'card' }) => {
  const renderCard = (key) => (
    <div key={key} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-6"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-slate-100 rounded"></div>
        <div className="h-10 bg-slate-100 rounded"></div>
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (type === 'table') {
    return renderTable();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => renderCard(i))}
    </div>
  );
};

export default LoadingSkeleton;
