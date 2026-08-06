"use client";

import { useState } from "react";

import SubCategoryList from "./SubCategoryList";

import { MetaConfig, SubCategory } from "./types";

interface Props {
  initialData: MetaConfig;
}

export default function MetaMasterForm({ initialData }: Props) {
  const [config, setConfig] = useState<MetaConfig>(initialData);

  async function updateSubCategories(subCategories: SubCategory[]) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/meta-configs/${config.id}`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        action: "REPLACE_SUBCATEGORIES",

        data: {
          subCategories,
        },
      }),
    });

    if (!res.ok) {
      console.error(await res.text());

      return;
    }

    const updated = await res.json();

    setConfig(updated);
  }

  return (
    <div className="w-full">
      <SubCategoryList
        selectedCategory={config.category.split("-").join(" ")}
        items={config.sub_categories ?? []}
        onChange={updateSubCategories}
      />
    </div>
  );
}
