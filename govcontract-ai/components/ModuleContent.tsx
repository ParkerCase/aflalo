"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ModuleContentProps = {
  bucket: string;
  moduleIndex: number;
};

export default function ModuleContent({ bucket, moduleIndex }: ModuleContentProps) {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 100 });
      if (error) {
        setFiles([]);
        setLoading(false);
        return;
      }
      const filesWithUrls = await Promise.all(
        (data ?? []).map(async (file: any) => {
          const { data: urlData } = await supabase.storage.from(bucket).createSignedUrl(file.name, 60 * 60);
          return { name: file.name, url: urlData?.signedUrl || '' };
        })
      );
      setFiles(filesWithUrls);
      setLoading(false);
    }
    fetchFiles();
  }, [bucket, moduleIndex]);

  if (loading) return <div>Loading module content...</div>;
  if (!files.length) return <div>No content uploaded yet for this module.</div>;

  return (
    <div className="mt-6 space-y-2">
      <h3 className="font-semibold mb-2">Module Files:</h3>
      <ul>
        {files.map((file) => (
          <li key={file.name}>
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {file.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
} 