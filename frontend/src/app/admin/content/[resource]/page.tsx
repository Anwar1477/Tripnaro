"use client";

import { notFound, useParams } from "next/navigation";
import { CouponSettingsPanel } from "@/components/admin/CouponSettingsPanel";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { RESOURCES } from "@/components/admin/resources";

export default function AdminResourcePage() {
  const { resource } = useParams<{ resource: string }>();
  const def = RESOURCES[resource];
  if (!def) notFound();
  return (
    <>
      {resource === "coupons" && <CouponSettingsPanel />}
      <ResourceManager key={def.path} def={def} />
    </>
  );
}
