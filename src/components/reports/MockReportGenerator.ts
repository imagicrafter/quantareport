
/**
 * This file is used to generate mock report content for development and testing purposes.
 * In production, this would be replaced by a real report generation service.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates mock report content based on project name and available images
 * 
 * @param projectName The name of the project
 * @param imageUrls Array of image URLs to include in the report
 * @returns HTML content for the report
 */
export const generateMockReport = (projectName: string, imageUrls: string[] = []): string => {
  console.log(`Generating mock report for project "${projectName}" with ${imageUrls.length} images`);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create report sections
  const intro = `
    <h1 style="text-align: center; color: #2563eb; margin-bottom: 20px;">${projectName} - Project Report</h1>
    <p style="text-align: center; font-style: italic; margin-bottom: 30px;">Generated on ${currentDate}</p>
    <h2>Executive Summary</h2>
    <p>This report provides a comprehensive overview of the ${projectName} project. It includes key findings, analysis of project assets, and recommendations for future actions.</p>
    <p>The project contains ${imageUrls.length} image${imageUrls.length !== 1 ? 's' : ''} that have been analyzed and incorporated into this report.</p>
  `;
  
  // Add project overview
  const overview = `
    <h2>Project Overview</h2>
    <p>Project Name: <strong>${projectName}</strong></p>
    <p>Project ID: <strong>${uuidv4().substring(0, 8)}</strong></p>
    <p>Status: <span style="color: green; font-weight: bold;">Active</span></p>
    <p>This project was created to address specific business needs and challenges. The following sections provide a detailed analysis of the project components and findings.</p>
  `;
  
  // Create image gallery section if images exist
  let imageGallery = '';
  if (imageUrls.length > 0) {
    const imageElements = imageUrls.map((url, index) => {
      return `
        <div style="margin-bottom: 20px;">
          <h4>Image ${index + 1}</h4>
          <img src="${url}" alt="Project Image ${index + 1}" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px;">
          <p style="font-style: italic; margin-top: 5px;">This image shows important project elements that have been analyzed.</p>
        </div>
      `;
    }).join('');
    
    imageGallery = `
      <h2>Image Analysis</h2>
      <p>The following images were analyzed as part of this project:</p>
      <div style="display: flex; flex-direction: column; gap: 20px;">
        ${imageElements}
      </div>
    `;
  }
  
  // Add findings section
  const findings = `
    <h2>Key Findings</h2>
    <ul>
      <li>Finding 1: The project demonstrates significant potential for growth in target markets.</li>
      <li>Finding 2: Current implementation meets industry standards and best practices.</li>
      <li>Finding 3: Several opportunities for optimization and enhancement have been identified.</li>
      ${imageUrls.length > 0 ? '<li>Finding 4: Image analysis reveals important patterns and insights.</li>' : ''}
    </ul>
  `;
  
  // Add recommendations
  const recommendations = `
    <h2>Recommendations</h2>
    <ol>
      <li>Continue development with focus on core features.</li>
      <li>Implement suggested optimizations within the next quarter.</li>
      <li>Consider expansion into adjacent markets based on current findings.</li>
      <li>Schedule follow-up analysis in 3 months to track progress.</li>
    </ol>
  `;
  
  // Add conclusion
  const conclusion = `
    <h2>Conclusion</h2>
    <p>The ${projectName} project shows promising results based on our analysis. By implementing the recommendations outlined in this report, the project is positioned for success.</p>
    <p>This report was automatically generated based on project data and analysis.</p>
  `;
  
  // Combine all sections
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      ${intro}
      <hr style="margin: 30px 0;">
      ${overview}
      <hr style="margin: 30px 0;">
      ${imageGallery}
      ${imageGallery ? '<hr style="margin: 30px 0;">' : ''}
      ${findings}
      <hr style="margin: 30px 0;">
      ${recommendations}
      <hr style="margin: 30px 0;">
      ${conclusion}
    </div>
  `;
};
