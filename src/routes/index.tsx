import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import LegacyApp from "@/legacy-app/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestão 3D — Ateliê 3D Hub" },
      { name: "description", content: "Sistema completo de gestão para ateliês de impressão 3D: produção, CRM, custos, integrações e vitrine." },
      { property: "og:title", content: "Gestão 3D — Ateliê 3D Hub" },
      { property: "og:description", content: "Sistema completo de gestão para ateliês de impressão 3D: produção, CRM, custos, integrações e vitrine." },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <LegacyApp />;
}
