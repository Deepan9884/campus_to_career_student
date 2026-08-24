import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tests")({
  beforeLoad: () => {
    throw redirect({
      to: "/super-dream",
    });
  },
  component: () => null,
});
