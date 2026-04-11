import React from 'react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import AppShell from '../components/layout/AppShell';

const DashboardPage: React.FC = () => {
  return (
    <AppShell
      eyebrow="Platform intelligence"
      title="Analytics Overview"
      description="Track message volume, token spend, provider behavior, and model performance from one premium workspace."
      contentWidth="wide"
    >
      <AnalyticsDashboard embedded />
    </AppShell>
  );
};

export default DashboardPage; 
