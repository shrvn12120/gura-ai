"use client";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Trash2 } from "lucide-react";

import { MetaField, FieldType } from "./types";
import SelectOptionsBuilder from "./SelectOptionsBuilder";
import FieldBuilder from "./FieldBuilder";
import { Separator } from "@/components/ui/separator";

interface Props {
  value: MetaField;

  onChange: (value: MetaField) => void;

  onDelete: () => void;
}

const fieldTypes: FieldType[] = [
  "string",
  "textarea",
  "number",
  "boolean",
  "select",
  "array",
];

export default function FieldForm({ value, onChange, onDelete }: Props) {
  function update(key: keyof MetaField, data: any) {
    onChange({
      ...value,

      [key]: data,
    });
  }

  return (

       <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 space-y-4">
        <div className="space-y-2">
          <Label>Key</Label>

          <Input
            placeholder="example: near by place"
            value={value.key.split("_").join(" ")}
            onChange={(e) => update("key", e.target.value.split(" ").join("_"))}
          />
        </div>

        <div className="space-y-2">
          <Label>Label</Label>

          <Input
            placeholder="Example: Near by place"
            value={value.label}
            onChange={(e) => update("label", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Field Type</Label>

        <Select
          value={value.type}
          onValueChange={(type) => update("type", type as FieldType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select field type" />
          </SelectTrigger>

          <SelectContent>
            {fieldTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.type === "select" && (
        <div className="space-y-4 pt-4 border-t overflow-y-auto">
          <SelectOptionsBuilder
            options={value.options ?? []}
            onChange={(options) => update("options", options)}
          />
        </div>
      )}

      {value.type === "array" && (
       
        <div className="pt-4 border-t space-y-4">
          <Label className="mb-6 block">Array Item Schema</Label>

          <FieldBuilder
            fields={value.itemSchema ?? []}
            onChange={(itemSchema) => update("itemSchema", itemSchema)}
          />
    
        </div>
       
      )}
<Separator />
      <div className="flex justify-end pt-2">
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2
            className="
h-4 w-4 mr-2
"
          />
          Delete Field
        </Button>
        
      </div>
    </div>

  );
}
