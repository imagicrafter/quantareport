
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReportWizardContainer from '../components/report-workflow/ReportWizardContainer';
import Step1Start from '../components/report-workflow/steps/Step1Start';
import Step2Files from '../components/report-workflow/steps/Step2Files';
import Step3Process from '../components/report-workflow/steps/Step3Process';
import Step4Notes from '../components/report-workflow/steps/Step4Notes';
import Step5Generate from '../components/report-workflow/steps/Step5Generate';
import Step6Review from '../components/report-workflow/steps/Step6Review';

const ReportWizard = () => {
  return (
    <Routes>
      <Route path="/" element={<ReportWizardContainer />}>
        <Route index element={<Navigate to="start" replace />} />
        <Route path="start" element={<Step1Start />} />
        <Route path="files" element={<Step2Files />} />
        <Route path="process" element={<Step3Process />} />
        <Route path="notes" element={<Step4Notes />} />
        <Route path="generate" element={<Step5Generate />} />
        <Route path="review" element={<Step6Review />} />
      </Route>
    </Routes>
  );
};

export default ReportWizard;
