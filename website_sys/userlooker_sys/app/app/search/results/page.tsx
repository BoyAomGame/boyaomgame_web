import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { SearchResultsClient } from "./SearchResultsClient";

function ResultsFallback() {
  return (
    <div className="max-w-2xl mx-auto px-6 w-full flex-1 pb-16">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-surface-container-low rounded-lg w-1/3" />
        <div className="h-48 bg-surface-container-low rounded-lg" />
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <PageShell>
      <Suspense fallback={<ResultsFallback />}>
        <SearchResultsClient />
      </Suspense>
    </PageShell>
  );
}
