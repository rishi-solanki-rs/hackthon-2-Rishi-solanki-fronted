import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/brand/BrandStates';

export const NotFoundPage: React.FC = () => (
  <div className="max-w-2xl mx-auto py-10 px-4">
    <EmptyState
      illustration="not-found"
      title="Page not found"
      description="This page doesn't exist. Start a task plan or browse what your neighbours share."
      action={
        <div className="flex gap-3 justify-center">
          <Link to="/plan/new" className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold">Plan a task</Link>
          <Link to="/browse" className="px-4 py-2 border border-surface-border bg-surface hover:bg-surface-secondary text-ink rounded-xl text-xs font-semibold">Browse catalog</Link>
        </div>
      }
    />
  </div>
);
