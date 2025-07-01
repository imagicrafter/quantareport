
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const ReportWizard = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Report Wizard</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              The report wizard functionality will be implemented here.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportWizard;
