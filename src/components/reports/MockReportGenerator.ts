
import { Report } from './ReportService';
import { v4 as uuidv4 } from 'uuid';

export const generateMockReport = (userId: string): Partial<Report> => {
  const projectName = "Sample Project";
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const title = `${projectName} Report - ${formattedDate}`;

  const mockContent = `
    <h1>Project Analysis Report</h1>
    <h2>Introduction</h2>
    <p>This report presents a comprehensive analysis of the ${projectName}. It examines the current state, challenges, and future opportunities for growth and improvement.</p>
    
    <h2>Executive Summary</h2>
    <p>The ${projectName} has shown promising results in the initial phase of implementation. Key stakeholders have expressed satisfaction with the progress made so far. However, there are several areas that require attention to ensure long-term success.</p>
    
    <h2>Findings</h2>
    <ul>
      <li>Strong user engagement in the first month of launch</li>
      <li>Technical infrastructure has proven reliable with 99.9% uptime</li>
      <li>Customer feedback indicates high satisfaction with core features</li>
      <li>Some performance issues identified in high-traffic scenarios</li>
    </ul>
    
    <h2>Analysis</h2>
    <p>Based on the data collected, we can conclude that the project is on track to meet its primary objectives. The technical foundation is solid, and user adoption is following projected patterns. Market response has been generally positive, with competitors taking notice of our innovations.</p>
    
    <h2>Recommendations</h2>
    <ol>
      <li>Enhance the user onboarding process to improve conversion rates</li>
      <li>Implement performance optimizations before the next traffic surge</li>
      <li>Develop additional features based on user feedback</li>
      <li>Increase marketing efforts in underperforming regions</li>
    </ol>
    
    <h2>Conclusion</h2>
    <p>The ${projectName} demonstrates significant potential for success in the current market. With targeted improvements and continued monitoring, we expect to exceed initial projections for user growth and revenue generation. The team should focus on implementing the recommendations outlined in this report to maximize long-term value.</p>
  `;

  return {
    title,
    content: mockContent,
    project_id: uuidv4(),
    user_id: userId,
    status: 'draft',
    image_urls: [
      'https://vtaufnxworztolfdwlll.supabase.co/storage/v1/object/public/pub_images/sample-chart-1.jpg',
      'https://vtaufnxworztolfdwlll.supabase.co/storage/v1/object/public/pub_images/sample-chart-2.jpg'
    ]
  };
};
