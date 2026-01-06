"use client";
import React, { useState } from 'react';
import { Book, Lock } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Course = {
  id: string;
  title: string;
  image: string;
  locked: boolean;
};

const courses: Course[] = [
  {
    id: 'gov-contracts',
    title: 'Government Contracts 101',
    image: '/images/course-placeholder.png',
    locked: true,
  },
  {
    id: 'gov-grants',
    title: 'Government Grants',
    image: '/images/course-placeholder.png',
    locked: true,
  },
  {
    id: 'ai-procurement',
    title: 'AI for Procurement',
    image: '/images/course-placeholder.png',
    locked: true,
  },
  {
    id: 'proposal-writing',
    title: 'Proposal Writing',
    image: '/images/course-placeholder.png',
    locked: true,
  },
  {
    id: 'compliance',
    title: 'Compliance & Reporting',
    image: '/images/course-placeholder.png',
    locked: true,
  },
  {
    id: 'advanced-ai',
    title: 'Advanced AI for Gov Contracts',
    image: '/images/course-placeholder.png',
    locked: true,
  },
];

export default function CoursesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [unlockedCourses, setUnlockedCourses] = useState<string[]>([]);
  const router = useRouter();

  const handleCardClick = (course: Course) => {
    const isUnlocked = unlockedCourses.includes(course.id);
    if (course.locked && !isUnlocked) {
      setSelectedCourse(course);
      setModalOpen(true);
    } else {
      router.push(`/courses/${course.id}`);
    }
  };

  const handleUnlock = () => {
    if (selectedCourse) {
      setUnlockedCourses((prev) => [...prev, selectedCourse.id]);
      setModalOpen(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Courses</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {courses.map((course) => {
          const isUnlocked = unlockedCourses.includes(course.id);
          return (
            <div
              key={course.id}
              className={`relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer border transition-all duration-200 ${(!isUnlocked && course.locked) ? 'opacity-60 grayscale' : 'hover:shadow-lg'}`}
              onClick={() => handleCardClick(course)}
            >
              <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-t-xl"
                />
                {!isUnlocked && course.locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <Lock className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col items-center">
                <Book className="h-6 w-6 text-blue-600 mb-2" />
                <h2 className="text-lg font-semibold text-center">{course.title}</h2>
              </div>
            </div>
          );
        })}
      </div>
      {/* Modal for unlock */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">Unlock Course</h3>
            <p className="mb-6">Would you like to unlock <span className="font-semibold">{selectedCourse?.title}</span> for <span className="text-blue-600 font-semibold">free</span>?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleUnlock}
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 