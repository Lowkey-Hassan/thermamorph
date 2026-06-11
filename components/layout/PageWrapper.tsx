import { cn } from '@/lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Constrain max width and add side padding */
  contained?: boolean;
}

/**
 * Wraps the main content area of each page.
 * Use `contained` for pages that shouldn't bleed edge-to-edge.
 */
export function PageWrapper({ children, className, contained = true }: PageWrapperProps) {
  return (
    <main
      className={cn(
        'flex-1 min-h-0 overflow-y-auto bg-[#0b1220]',
        className
      )}
    >
      <div
        className={cn(
          contained && 'max-w-screen-xl mx-auto px-6 py-6',
          !contained && 'h-full'
        )}
      >
        {children}
      </div>
    </main>
  );
}

/** The outer flex shell that wraps Sidebar + content area */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1220]">
      {children}
    </div>
  );
}

/** The right-side column (header + page) */
export function ContentColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
      {children}
    </div>
  );
}
