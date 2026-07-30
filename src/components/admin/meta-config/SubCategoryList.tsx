"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  ArrowLeftFromLineIcon,
  Trash,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
        <CardContent className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold capitalize">{selectedCategory.replaceAll("-", " ")}</h1>
            <p className="text-muted-foreground text-sm">
              Manage sub categories and their dynamic fields
            </p>
          </div>
          <Button size={"xs"} variant="outline" asChild>
            <Link href={"/admin/config/meta-configs"}>
              <ArrowLeftFromLineIcon className="mr-2 h-4 w-4" /> Go Back
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* SIDEBAR */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
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
              <div
                key={item.name}
                className={`w-full text-left rounded-lg p-3 transition border flex flex-col gap-2 ${
                  editing?.name === item.name
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize text-sm">
                    {item.name ? item.name.replaceAll("-", " ") : "Unnamed Subcategory"}{" "}
                    <Badge variant="secondary" className="ml-1">{item.fields.length}</Badge>
                  </span>
                </div>

                <div className="flex gap-x-2 w-full justify-end">
                  <Button size={"icon-xs"} variant="outline" onClick={() => setEditing(item)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {/* Correctly hooking up remove callback function handler */}
                  <SubDeleteDialog 
                    sub={item.name} 
                    onDelete={() => remove(item.name)} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* MAIN EDITOR */}
        <Card className="col-span-12 lg:col-span-9">
          <CardHeader>
            <CardTitle className="capitalize">
              {editing && editing.name
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
              <div className="h-96 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <p className="text-sm">Select or create a sub category to define metadata properties</p>
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
                  Create New Sub Category
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DeleteDialogProps {
  sub: string;
  onDelete: () => void;
}

function SubDeleteDialog({ sub, onDelete }: DeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size={"icon-xs"} variant={"destructive"} disabled={sub === "default"}>
          <Trash className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the metadata configuration profile for{" "}
            <span className="font-semibold text-foreground">"{sub.replaceAll("-", " ")}"</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {/* Action trigger hooks into our bound function */}
          <AlertDialogAction 
            onClick={onDelete} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}