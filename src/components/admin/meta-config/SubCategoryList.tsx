"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Plus, Pencil, Trash2, ArrowLeftFromLineIcon } from "lucide-react";

import SubCategoryForm from "./SubCategoryForm";

import { SubCategory } from "./types";
import Link from "next/link";

interface Props {
  items: SubCategory[];

  selectedCategory: string;

  onChange: (items: SubCategory[]) => void;
}

export default function SubCategoryList({
  items,
  selectedCategory,
  onChange,
}: Props) {
  const [editing, setEditing] = useState<SubCategory | null>(null);

  function save(item: SubCategory) {
    const exists = items.some((x) => x.name === item.name);

    const updated = exists
      ? items.map((x) => (x.name === item.name ? item : x))
      : [...items, item];

    onChange(updated);

    setEditing(item);
  }

  function remove(name: string) {
    onChange(items.filter((x) => x.name !== name));

    if (editing?.name === name) {
      setEditing(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <Card className="h-fit">
        <CardContent className="px-6">
          <h1 className="text-2xl font-bold capitalize">{selectedCategory}</h1>

          <p className="text-muted-foreground">
            Manage sub categories and their dynamic fields
          </p>
          <Button size={"xs"} asChild>
            <Link href={"/admin/config/meta-configs"}>
              <ArrowLeftFromLineIcon /> Go Back
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div
        className="
grid
grid-cols-12
gap-6
"
      >
        {/* SIDEBAR */}

        <Card
          className="
col-span-12
lg:col-span-3
"
        >
          <CardHeader>
            <div
              className="
flex
justify-between
items-center
"
            >
              <CardTitle className="text-base">Sub Categories</CardTitle>

              <Button
                size="icon"
                onClick={() =>
                  setEditing({
                    name: "",
                    fields: [],
                  })
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {items.map((item) => (
              <button
                key={item.name}
                onClick={() => setEditing(item)}
                className={`
w-full
text-left
rounded-lg
p-3
transition
border

${
  editing?.name === item.name
    ? "bg-primary/10 border-primary"
    : "hover:bg-muted"
}

`}
              >
                <div
                  className="
flex
justify-between
items-center
"
                >
                  <span
                    className="
font-medium
capitalize
"
                  >
                    {item.name.replaceAll("-", " ")}
                  </span>

                  <Badge variant="secondary">{item.fields.length}</Badge>
                </div>

                <p
                  className="
text-xs
text-muted-foreground
mt-1
"
                >
                  fields
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* MAIN EDITOR */}

        <Card
          className="
col-span-12
lg:col-span-9
"
        >
          <CardHeader>
            <CardTitle className=" capitalize">
              {editing
                ? editing.name.replaceAll("-", " ")
                : "Create Sub Category"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {editing ? (
              <SubCategoryForm
                value={editing}
                onSave={save}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                className="
h-125
flex
flex-col
items-center
justify-center
text-muted-foreground
gap-3
"
              >
                <p>Select a sub category</p>

                <Button
                  variant="outline"
                  onClick={() =>
                    setEditing({
                      name: "",
                      fields: [],
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
