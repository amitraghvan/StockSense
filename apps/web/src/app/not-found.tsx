import Link from 'next/link';
import { Button, EmptyState } from '@stocksense/ui';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-12">
      <EmptyState
        icon={<FileQuestion className="h-8 w-8" />}
        title="Page Not Found"
        description="The requested route does not exist or has not been activated in Phase 01."
        action={
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Foundation Overview
            </Button>
          </Link>
        }
      />
    </div>
  );
}
