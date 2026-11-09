"use client";

import { notFound, useParams } from "next/navigation";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { RESOURCES } from "@/components/admin/resources";

export default function AdminResourcePage() {
  const { resource } = useParams<{ resource: string }>();
  const def = RESOURCES[resource];
  if (!def) notFound();
  return <ResourceManager key={def.path} def={def} />;
}
