// components/DynamicMetaForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

interface Props {
  category: string;
  subCategory: string;
  onSubmit: (formData: Record<string, any>) => void;
}

export default function DynamicMetaForm({ category, subCategory, onSubmit }: Props) {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meta-configs?category=${"food-and-beverage"}&subCategory=${"restaurant"}`);
        const fieldsConfig = await res.json();
        setFields(fieldsConfig);
      } catch (err) {
        console.error("Failed to load schema configuration", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [category, subCategory]);

  if (loading) return <div className="text-sm text-muted-foreground p-4">Loading form structure...</div>;

  return <FormContainer fields={fields} category={category} subCategory={subCategory} onFormSubmit={onSubmit} />;
}

function FormContainer({ fields, category, subCategory, onFormSubmit }: { fields: any[]; category: string; subCategory: string; onFormSubmit: any }) {
  
  // Construct defaults
  const defaultValues: Record<string, any> = {};
  fields.forEach((field) => {
    if (field.type === "boolean") defaultValues[field.key] = field.defaultValue ?? false;
    else if (field.type === "array") defaultValues[field.key] = field.defaultValue ?? [];
    else if (field.type === "number") defaultValues[field.key] = field.defaultValue ?? 0;
    else defaultValues[field.key] = field.defaultValue ?? "";
  });

  // Loose runtime schema built dynamically from keys
  const schemaShape: Record<string, any> = {};
  fields.forEach((field) => {
    if (field.type === "boolean") schemaShape[field.key] = z.boolean();
    else if (field.type === "number") schemaShape[field.key] = z.coerce.number();
    else if (field.type === "array") schemaShape[field.key] = z.array(z.any());
    else schemaShape[field.key] = z.string().optional();
  });

  const methods = useForm({
    resolver: zodResolver(z.object(schemaShape)),
    defaultValues,
  });


  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-6 max-w-xl p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
        <div>
          <h3 className="text-lg font-semibold capitalize tracking-tight">{category} Details</h3>
          <p className="text-xs text-muted-foreground">Subcategory configuration: {subCategory}</p>
        </div>
        
        {fields.map((field) => {
          if (!field.key && field.type !== "array") return null;

          switch (field.type) {
            case "boolean":
              return (
                <Field key={field.key} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <Checkbox 
                    id={field.key}
                    checked={methods.watch(field.key)} 
                    onCheckedChange={(checked) => methods.setValue(field.key, checked)} 
                  />
                  <div className="space-y-1 leading-none">
                    <FieldLabel htmlFor={field.key}>{field.label}</FieldLabel>
                  </div>
                </Field>
              );

            case "string":
            case "number":
              return (
                <Field key={field.key}>
                  <FieldLabel>{field.label}</FieldLabel>
                  <FieldGroup>
                    <Input 
                      type={field.type === "number" ? "number" : "text"} 
                      placeholder={field.placeholder} 
                      {...methods.register(field.key)} 
                    />
                  </FieldGroup>
                </Field>
              );

            case "textarea":
              return (
                <Field key={field.key}>
                  <FieldLabel>{field.label}</FieldLabel>
                  <FieldGroup>
                    <Textarea 
                      placeholder={field.placeholder} 
                      {...methods.register(field.key)} 
                      className="min-h-20" 
                    />
                  </FieldGroup>
                </Field>
              );

            case "select":
              return (
                <Field key={field.key}>
                  <FieldLabel>{field.label}</FieldLabel>
                  <Select 
                    onValueChange={(val) => methods.setValue(field.key, val)} 
                    value={methods.watch(field.key)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a value" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              );

            case "array":
              return <DynamicArrayField key={field.key} fieldConfig={field} />;

            default:
              return null;
          }
        })}

        <Button type="submit" className="w-full">Save Meta Details</Button>
      </form>
    
    </FormProvider>
  );
}

// Custom internal FieldArray handler
function DynamicArrayField({ fieldConfig }: { fieldConfig: any }) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldConfig.key,
  });

  const handleAddItem = () => {
    const newItem: Record<string, any> = {};
    fieldConfig.itemSchema.forEach((sField: any) => {
      newItem[sField.key || "value"] = sField.defaultValue ?? "";
    });
    append(newItem);
  };

  return (
    <Field className="space-y-3 rounded-lg border p-4 bg-muted/40">
      <FieldLabel className="text-sm font-medium">{fieldConfig.label}</FieldLabel>
      
      <FieldGroup className="flex flex-col gap-2 border-none p-0 shadow-none bg-transparent">
        {fields.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 bg-background p-2 rounded border shadow-sm w-full">
            {fieldConfig.itemSchema.map((subField: any) => {
              const innerPropKey = subField.key || "value";
              return (
                <div key={subField.key || innerPropKey} className="flex-1">
                  <Input
                    placeholder={subField.label || "Value"}
                    {...register(`${fieldConfig.key}.${index}.${innerPropKey}`)}
                    className="h-8 text-xs"
                  />
                </div>
              );
            })}
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
            >
              ✕
            </Button>
          </div>
        ))}
      </FieldGroup>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddItem}
        className="mt-2 text-xs"
      >
        + Add {fieldConfig.label} Item
      </Button>
    </Field>
  );
}