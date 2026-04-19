// src/pages/guide/ProjectRequests.tsx
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';


interface ProjectRequest {
  id: number;
  title: string;
  domain: string;
  studentName: string;
  description: string;
}

const ProjectRequests: React.FC = () => {
  // Mock data for project requests
  const [requests, setRequests] = useState<ProjectRequest[]>([
    {
      id: 1,
      title: 'AI-Powered Healthcare System',
      domain: 'Artificial Intelligence',
      studentName: 'John Doe',
      description: 'A comprehensive AI system for healthcare diagnostics and patient management.',
    },
    {
      id: 2,
      title: 'Blockchain Voting System',
      domain: 'Blockchain',
      studentName: 'Jane Smith',
      description: 'Secure and transparent voting system using blockchain technology.',
    },
    {
      id: 3,
      title: 'IoT Smart Home Automation',
      domain: 'Internet of Things',
      studentName: 'Alex Johnson',
      description: 'Smart home system with IoT devices for automation and energy efficiency.',
    },
    {
      id: 4,
      title: 'ML for Financial Fraud Detection',
      domain: 'Machine Learning',
      studentName: 'Sarah Williams',
      description: 'Using machine learning algorithms to detect fraudulent transactions.',
    },
  ]);

  const handleApprove = (id: number) => {
    // In a real app, you would make an API call here
    setRequests(prev => prev.filter(request => request.id !== id));
  };

  const handleReject = (id: number) => {
    // In a real app, you would make an API call here
    setRequests(prev => prev.filter(request => request.id !== id));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Requests</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {request.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {request.domain}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Student:</span> {request.studentName}
                </p>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  {request.description}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-3">
                <button
                  onClick={() => handleReject(request.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800 transition-colors duration-200"
                  aria-label={`Reject ${request.title}`}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(request.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800 transition-colors duration-200"
                  aria-label={`Approve ${request.title}`}
                >
                  <Check className="h-4 w-4 mr-1" /> Approve
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No pending project requests.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectRequests;