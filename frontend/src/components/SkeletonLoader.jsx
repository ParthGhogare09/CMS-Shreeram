import React from 'react';

export const CardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-title skeleton-loading" style={{ height: '16px', marginBottom: '12px' }}></div>
    <div className="skeleton-text skeleton-loading" style={{ height: '24px', width: '60%', marginBottom: '8px' }}></div>
    <div className="skeleton-subtitle skeleton-loading" style={{ height: '12px', width: '40%' }}></div>
  </div>
);

export const RowSkeleton = () => (
  <div className="skeleton-table-row skeleton-loading" style={{ height: '44px', marginBottom: '10px', borderRadius: '6px' }}></div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="card" style={{ padding: '1.5rem' }}>
    <div className="skeleton-title skeleton-loading" style={{ width: '180px', height: '20px', marginBottom: '1.5rem' }}></div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {Array(rows).fill(0).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="dashboard-container">
    <div className="page-header" style={{ marginBottom: '1.5rem' }}>
      <div className="skeleton-title skeleton-loading" style={{ width: '220px', height: '24px' }}></div>
    </div>

    <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>

    <div className="dashboard-main-row" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '320px', flex: 2 }}>
        <div className="skeleton-title skeleton-loading" style={{ width: '35%' }}></div>
        <div className="skeleton-loading" style={{ flex: 1, borderRadius: '8px', marginTop: '1rem', opacity: 0.2 }}></div>
      </div>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '320px', flex: 1 }}>
        <div className="skeleton-title skeleton-loading" style={{ width: '50%' }}></div>
        <div className="skeleton-loading" style={{ flex: 1, borderRadius: '8px', marginTop: '1rem', opacity: 0.2 }}></div>
      </div>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '320px', flex: 1.2 }}>
        <div className="skeleton-title skeleton-loading" style={{ width: '60%' }}></div>
        <div className="skeleton-loading" style={{ flex: 1, borderRadius: '8px', marginTop: '1rem', opacity: 0.2 }}></div>
      </div>
    </div>
  </div>
);

export const DetailSkeleton = () => (
  <div className="project-details-container">
    <div className="page-header" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
      <div className="skeleton-circle skeleton-loading" style={{ width: '36px', height: '36px' }}></div>
      <div className="skeleton-title skeleton-loading" style={{ width: '280px', height: '24px', margin: 0 }}></div>
    </div>

    <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TableSkeleton rows={3} />
      <TableSkeleton rows={3} />
    </div>
  </div>
);

const SkeletonLoader = ({ type = 'table', rows = 5 }) => {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'detail':
      return <DetailSkeleton />;
    case 'table':
    default:
      return <TableSkeleton rows={rows} />;
  }
};

export default SkeletonLoader;
