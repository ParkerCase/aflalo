"use client";
import { notFound, useParams } from 'next/navigation';
import { Book, Lock, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import ModuleContent from '@/components/ModuleContent';

const courses = [
  {
    id: 'gov-contracts',
    title: 'Government Contracts 101',
    modules: [
      'Introduction',
      'Finding Opportunities',
      'Proposal Basics',
      'Compliance',
      'Submission & Follow-up',
    ],
  },
  {
    id: 'gov-grants',
    title: 'Government Grants',
    modules: [
      'Overview',
      'Eligibility',
      'Application Process',
      'Reporting',
    ],
  },
  {
    id: 'ai-procurement',
    title: 'AI for Procurement',
    modules: [
      'AI Basics',
      'Use Cases',
      'Implementation',
    ],
  },
  {
    id: 'proposal-writing',
    title: 'Proposal Writing',
    modules: [
      'Getting Started',
      'Writing Tips',
      'Review & Edit',
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & Reporting',
    modules: [
      'Compliance Overview',
      'Reporting Requirements',
    ],
  },
  {
    id: 'advanced-ai',
    title: 'Advanced AI for Gov Contracts',
    modules: [
      'Advanced Concepts',
      'Case Studies',
    ],
  },
];

const courseBuckets = [
  'course-1',
  'course-2',
  'course-3',
  'course-4',
  'course-5',
  'course-6',
];

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  // Progress: index of last completed module
  const [progress, setProgress] = useState(0);

  const course = courses.find((c) => c.id === courseId);
  if (!course) return notFound();

  const courseIndex = courses.findIndex((c) => c.id === courseId);
  const bucketName = courseBuckets[courseIndex];

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="flex items-center gap-4 mb-8">
        <Book className="h-10 w-10 text-blue-600" />
        <h1 className="text-2xl font-bold">{course.title}</h1>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Modules</h2>
        <ol className="space-y-4">
          {course.modules.map((module, idx) => {
            const isUnlocked = idx <= progress;
            const isCompleted = idx < progress;
            return (
              <li
                key={module}
                className={`flex items-center gap-3 p-4 border rounded-lg ${isUnlocked ? 'bg-blue-50' : 'bg-gray-50 opacity-60'} transition-all`}
              >
                <span className="font-bold text-blue-600">{idx + 1}</span>
                <span className="text-gray-900 font-medium flex-1">{module}</span>
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : isUnlocked ? (
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    onClick={() => setProgress(idx + 1)}
                  >
                    Mark Complete
                  </button>
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
              </li>
            );
          })}
        </ol>
        {/* Show module content for the current unlocked module */}
        <ModuleContent bucket={bucketName} moduleIndex={progress} />
      </div>
    </div>
  );
} 