import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { TaskSafetyGate } from '@sidekit/shared';

interface SafetyGateNoticeProps {
  gate: TaskSafetyGate;
  suppressedItemNames?: string[];
}

export const SafetyGateNotice: React.FC<SafetyGateNoticeProps> = ({ gate, suppressedItemNames }) => (
  <div role="alert" className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
    <div className="space-y-1">
      <p className="text-sm font-bold">{gate.title}</p>
      <p className="text-xs leading-relaxed">{gate.message}</p>
      {suppressedItemNames && suppressedItemNames.length > 0 && (
        <p className="text-xs leading-relaxed">
          Hidden for safety: {suppressedItemNames.join(', ')}.
        </p>
      )}
    </div>
  </div>
);
