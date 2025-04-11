
import React from 'react';

const WorkflowLoading: React.FC = () => {
  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    </div>
  );
};

export default WorkflowLoading;
