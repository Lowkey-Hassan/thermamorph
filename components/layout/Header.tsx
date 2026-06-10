'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 px-6 py-3.5">
        {/* Left: title */}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
          )}
        </div>

        {/* Right: search, bell, action */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex text-slate-400 hover:text-slate-700"
            icon={<Search className="h-4 w-4" />}
            aria-label="Search"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-700 relative"
            icon={<Bell className="h-4 w-4" />}
            aria-label="Notifications"
          >
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </Button>
          {action}
        </div>
      </div>
    </header>
  );
}
