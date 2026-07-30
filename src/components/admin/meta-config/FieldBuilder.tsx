"use client";

import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Plus } from "lucide-react";

import FieldForm from "./FieldForm";

import { MetaField } from "./types";

interface Props {
  fields: MetaField[];

  onChange: (fields: MetaField[]) => void;
}

export default function FieldBuilder({ fields, onChange }: Props) {
  function add() {
    onChange([
      ...fields,
      {
        key: "",
        label: "",
        type: "string",
      },
    ]);
  }

  function remove(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function update(index: number, field: MetaField) {
    onChange(fields.map((item, i) => (i === index ? field : item)));
  }

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <Card>
          <CardContent
            className="
py-8
text-center
text-sm
text-muted-foreground
"
          >
            No fields added yet.
          </CardContent>
        </Card>
      )}

      {fields.length > 0 && (
        <Accordion type="single" collapsible className="space-y-2">
          {fields.map((field, index) => (
            <AccordionItem
              key={index}
              value={`field-${index}`}
              className="border rounded-lg"
            >
              <AccordionTrigger className="bg-accent ">
                <div className="flex items-center gap-3 px-3">
                  {field.key ? (
                    <Badge variant="outline">{field.label}</Badge>
                  ) : (
                    <span>Field -#{index + 1}</span>
                  )}

                  {field.type && (
                    <Badge variant="secondary">{field.type}</Badge>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-3 h-fit!">
                <div className="pt-3 pb-2">
                  <FieldForm
                    value={field}
                    onChange={(v) => update(index, v)}
                    onDelete={() => remove(index)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {/* <div className="sticky bottom-0 w-full bg-card py-4"> */}
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      {/* </div> */}
    </div>
  );
}
