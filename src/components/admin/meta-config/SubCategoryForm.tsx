"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import FieldBuilder from "./FieldBuilder";

import { SubCategory, MetaField } from "./types";

interface Props {
  value: SubCategory | null;

  onSave: (value: SubCategory) => void;

  onCancel: () => void;
}

export default function SubCategoryForm({ value, onSave, onCancel }: Props) {
  const [name, setName] = useState(value?.name ?? "");

  const [fields, setFields] = useState<MetaField[]>(value?.fields ?? []);

  useEffect(() => {
    setName(value?.name ?? "");
    setFields(value?.fields ?? []);
  }, [value]);

  const [error, setError] = useState("");

  function save() {
    if (!name.trim()) {
      setError("Sub category name is required");

      return;
    }

    onSave({
      name: name.trim(),

      fields,
    });
  }

  return (
    <div className="space-y-6 relative">
      <div className="space-y-6 px-3 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Sub Category Name</Label>

              <Input
                placeholder="Example: faq"
                value={name.split("-").join(" ")}
                onChange={(e) => {
                  setName(e.target.value.split(" ").join("-"));

                  setError("");
                }}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fields</CardTitle>
          </CardHeader>

          <CardContent>
            <FieldBuilder fields={fields} onChange={setFields} />
          </CardContent>
        </Card>
      </div>
      <div className="w-full flex justify-end gap-3  py-5 px-3 ">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button onClick={save}>Save Sub Category</Button>
      </div>
    </div>
  );
}
