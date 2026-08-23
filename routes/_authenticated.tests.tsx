import { createFileRoute } from "@tanstack/react-router";
import { TestArenaSection } from "@/components/tests/TestArenaSection";

export const Route = createFileRoute("/_authenticated/tests")({
  head: () => ({
    meta: [
      {
        title: "Proctored Online Coding Tests & Assessment Hub — Campus to Career",
      },
    ],
  }),
  component: TestsPage,
});

function TestsPage() {
  return <TestArenaSection />;
}
