'use client';

// Story 6.9: JSON Editor Component
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface JsonEditorProps {
  value: string; // JSON string
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export default function JsonEditor({
  value,
  onChange,
  height = '300px',
  readOnly = false,
}: JsonEditorProps) {
  const [error, setError] = useState<string>('');
  const [editorValue, setEditorValue] = useState(value);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue === undefined) return;

    setEditorValue(newValue);

    // Validate JSON
    try {
      JSON.parse(newValue);
      setError('');
      onChange(newValue);
    } catch (e) {
      setError('Invalid JSON: ' + (e as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      <Editor
        height={height}
        language="json"
        value={editorValue}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          formatOnPaste: true,
          formatOnType: true,
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
        }}
        theme="vs-dark"
      />
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
