
import React from 'react';

const WorkflowLoading: React.FC = () => {
  return (
    <div className="container mx-auto px-4 pt-16 pb-12">
      <div className="flex flex-col justify-center items-center h-32">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading workflow...</p>
      </div>
    </div>
  );
};

export default WorkflowLoading;
