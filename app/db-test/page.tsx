'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('Comment added successfully!');
        setComment('');
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Database Connection</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Add a Comment
          </label>
          <input
            type="text"
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          Submit
        </button>
      </form>
      
      {status && (
        <div className={`mt-4 p-3 rounded-md ${status.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {status}
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <CommentsList />
      </div>
    </div>
  );
}

// Client component to fetch and display comments
function CommentsList() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch('/api/comments');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setComments(data.comments);
        } else {
          throw new Error(data.error || 'Failed to fetch comments');
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchComments();
  }, []);
  
  if (loading) return <p className="text-gray-500">Loading comments...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (comments.length === 0) return <p className="text-gray-500">No comments yet.</p>;
  
  return (
    <ul className="space-y-2">
      {comments.map((comment, index) => (
        <li key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50">
          {comment.comment}
          <div className="text-xs text-gray-500 mt-1">
            {new Date(comment.created_at).toLocaleString()}
          </div>
        </li>
      ))}
    </ul>
  );
} 