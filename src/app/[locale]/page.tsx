import { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { getGlobeData } from "@/server/globe/get-globe-data";

import GlobeScene from "./components/globe-scene";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Globe");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function GlobePage() {
  const data = await getGlobeData();

  return (
    // <div className={tajawal.variable}>
    <GlobeScene data={data} />
    // </div>
  );
}

