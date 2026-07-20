"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];

  onChange: (options: Option[]) => void;
}

export default function SelectOptionsBuilder({ options, onChange }: Props) {
  function add() {
    onChange([
      ...options,
      {
        label: "",
        value: "",
      },
    ]);
  }

  function update(index: number, key: keyof Option, value: string) {
    onChange(
      options.map((item, i) =>
        i === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  }

  function remove(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <h4 className="font-medium">Options</h4>

        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      {options.map((option, index) => (
        <div
          key={index}
          className="
grid grid-cols-[1fr_1fr_auto]
gap-2
"
        >
          <Input
            placeholder="Label"
            value={option.label}
            onChange={(e) => update(index, "label", e.target.value)}
          />

          <Input
            placeholder="Value"
            value={option.value}
            onChange={(e) => update(index, "value", e.target.value)}
          />

          <Button
            size="icon"
            variant="destructive"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
