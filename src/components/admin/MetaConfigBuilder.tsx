// components/MetaConfigAdmin.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

const FieldConfigSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().min(1, "Subcategory is required"),
  fields: z.array(z.any()),
});

type BuilderFormValues = z.infer<typeof FieldConfigSchema>;

export default function MetaConfigAdmin() {
  const [configsList, setConfigsList] = useState<any[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<{ category: string; subCategory: string } | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);

  // New category/subcategory creation states
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState("default");

  const methods = useForm<BuilderFormValues>({
    resolver: zodResolver(FieldConfigSchema),
    defaultValues: { category: "", subCategory: "", fields: [] },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: methods.control,
    name: "fields",
  });

  // 1. Fetch index map profiles from the server on layout mount
  const fetchAllConfigs = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/meta-configs");
      if (res.ok) {
        const data = await res.json();
        setConfigsList(data);
      }
    } catch (err) {
      console.error("Failed to load configs directory", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAllConfigs();
  }, []);

  // 2. Load selected configuration properties into the active form buffer
  const handleSelectConfig = (config: any) => {
    setSelectedConfig({ category: config.category, subCategory: config.subCategory });
    methods.reset({
      category: config.category,
      subCategory: config.subCategory,
      fields: config.fields || [],
    });
  };

  // 3. Handle setup creation for brand-new configurations
  const handleCreateNewConfig = () => {
    if (!newCat.trim() || !newSub.trim()) return alert("Provide both category and subcategory labels.");
    
    const formattedCat = newCat.trim().toLowerCase().replace(/\s+/g, "-");
    const formattedSub = newSub.trim().toLowerCase().replace(/\s+/g, "-");

    // Check duplication profiles
    const exists = configsList.some(
      (c) => c.category === formattedCat && c.subCategory === formattedSub
    );
    if (exists) return alert("This configuration target mapping already exists.");

    const newEmptyConfig = { category: formattedCat, subCategory: formattedSub, fields: [] };
    
    setConfigsList((prev) => [...prev, newEmptyConfig]);
    handleSelectConfig(newEmptyConfig);
    setNewCat("");
    setNewSub("default");
  };

  const onSubmit = async (data: BuilderFormValues) => {
    setSaving(true);
    try {
      const response = await fetch("/api/meta-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed saving configuration payload");
      
      alert("Configuration changes synchronized securely with MongoDB.");
      await fetchAllConfigs(); // Refresh index layout
    } catch (err) {
      console.error(err);
      alert("Error committing update profiles to remote schema instance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-6 max-w-6xl mx-auto p-4 items-start min-h-150">
      
      {/* SIDEBAR: Configuration Space & Hierarchy Navigator */}
      <div className="w-64 border rounded-xl p-4 space-y-4 bg-muted/20 shrink-0 self-stretch flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Configurations Map</h3>
            <p className="text-[11px] text-muted-foreground">Select an existing schema pattern to edit attributes.</p>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-87.5 pr-1">
            {loadingList ? (
              <p className="text-xs text-muted-foreground animate-pulse">Index mapping loading...</p>
            ) : configsList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No dynamic profiles active.</p>
            ) : (
              configsList.map((c, i) => {
                const isActive = selectedConfig?.category === c.category && selectedConfig?.subCategory === c.subCategory;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectConfig(c)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition border flex flex-col gap-0.5 ${
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary font-medium" 
                        : "hover:bg-muted bg-background text-foreground border-transparent"
                    }`}
                  >
                    <span className="font-semibold capitalize truncate">{c.category.replace(/-/g, " ")}</span>
                    <span className={isActive ? "text-primary-foreground/70 text-[10px]" : "text-muted-foreground text-[10px]"}>
                      ↳ sub: {c.subCategory}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CREATOR PAD: Inject a completely new mapping category context */}
        <div className="pt-4 border-t space-y-3">
          <span className="text-xs font-bold block text-foreground">Create New Space Context</span>
          
          <Field>
            <Input 
              placeholder="category (e.g., hotel-services)" 
              value={newCat} 
              onChange={(e) => setNewCat(e.target.value)} 
              className="h-7 text-xs"
            />
          </Field>
          <Field>
            <Input 
              placeholder="subcategory (e.g., standard)" 
              value={newSub} 
              onChange={(e) => setNewSub(e.target.value)} 
              className="h-7 text-xs"
            />
          </Field>
          <Button type="button" size="sm" className="w-full text-xs h-8" variant="secondary" onClick={handleCreateNewConfig}>
            + Add New Layout Config
          </Button>
        </div>
      </div>

      {/* WORKSPACE AREA: Dynamic Field Structural Editor */}
      <div className="flex-1 min-w-0">
        {!selectedConfig ? (
          <div className="h-full border border-dashed rounded-xl flex items-center justify-center flex-col text-center p-8 bg-card text-muted-foreground">
            <span className="text-2xl mb-2">📋</span>
            <p className="text-sm font-semibold">No Dynamic Profile Workspace Target Active</p>
            <p className="text-xs max-w-xs mt-1">Select an item from the left tracking index pane or spin up a new target layout context pattern.</p>
          </div>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 p-6 border rounded-xl bg-card shadow-sm">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight capitalize">
                    Workspace: {methods.watch("category").replace(/-/g, " ")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Sub-schema routing tier identity: <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono">{methods.watch("subCategory")}</code>
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ key: "", label: "", type: "string" })}>
                  + Add Input Attribute
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-8 border border-dashed rounded-lg bg-muted/10">
                  This schema currently holds no properties. Use the top button to spin up interface fields.
                </p>
              )}

              <div className="space-y-4 max-h-125 overflow-y-auto pr-2">
                {fields.map((item, index) => (
                  <FieldCard key={item.id} index={index} onRemove={() => remove(index)} namePrefix={`fields.${index}`} />
                ))}
              </div>

              <div className="border-t pt-4 flex justify-end gap-2">
                <Button type="submit" disabled={saving} className="min-w-30">
                  {saving ? "Syncing..." : "Save Layout Target Structure"}
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   NESTED UTILITY FORM CARDS (FieldCard, SelectOptionsBuilder, NestedItemSchemaBuilder)
   ========================================================================== */

function FieldCard({ index, onRemove, namePrefix }: { index: number; onRemove: () => void; namePrefix: string }) {
  const { register, watch, setValue } = useFormContext();
  const currentType = watch(`${namePrefix}.type`);

  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-4 relative group shadow-xs">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
      >
        ✕
      </Button>

      <div className="grid grid-cols-3 gap-3">
        <Field>
          <FieldLabel className="text-xs">Database Key</FieldLabel>
          <FieldGroup>
            <Input placeholder="cuisine_types" {...register(`${namePrefix}.key`)} className="h-8 text-xs" />
          </FieldGroup>
        </Field>

        <Field>
          <FieldLabel className="text-xs">UI Label Name</FieldLabel>
          <FieldGroup>
            <Input placeholder="Cuisine Types" {...register(`${namePrefix}.label`)} className="h-8 text-xs" />
          </FieldGroup>
        </Field>

        <Field>
          <FieldLabel className="text-xs">Input Widget UI Type</FieldLabel>
          <Select
            value={currentType || "string"}
            onValueChange={(val) => {
              setValue(`${namePrefix}.type`, val);
              setValue(`${namePrefix}.options`, []);
              setValue(`${namePrefix}.itemSchema`, []);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["string", "number", "boolean", "textarea", "select", "array"].map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {currentType === "select" && <SelectOptionsBuilder namePrefix={namePrefix} />}
      {currentType === "array" && <NestedItemSchemaBuilder namePrefix={namePrefix} />}

      {currentType !== "array" && currentType !== "select" && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-muted/50">
          <Field>
            <FieldLabel className="text-xs">Placeholder Text</FieldLabel>
            <FieldGroup>
              <Input placeholder="e.g. Enter description" {...register(`${namePrefix}.placeholder`)} className="h-8 text-xs" />
            </FieldGroup>
          </Field>

          <Field>
            <FieldLabel className="text-xs">Fallback Default Value</FieldLabel>
            <FieldGroup>
              {currentType === "boolean" ? (
                <div className="flex items-center space-x-2 h-8">
                  <Checkbox 
                    id={`${namePrefix}.defaultValue`}
                    checked={watch(`${namePrefix}.defaultValue`) === true}
                    onCheckedChange={(checked) => setValue(`${namePrefix}.defaultValue`, checked)}
                  />
                  <span className="text-xs text-muted-foreground">True by default</span>
                </div>
              ) : (
                <Input placeholder="Initial literal choice value" {...register(`${namePrefix}.defaultValue`)} className="h-8 text-xs" />
              )}
            </FieldGroup>
          </Field>
        </div>
      )}
    </div>
  );
}

function SelectOptionsBuilder({ namePrefix }: { namePrefix: string }) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: `${namePrefix}.options` });

  return (
    <div className="pt-2 border-t space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold">Select Options Selection Menu</span>
        <Button type="button" variant="outline" size="xs" className="h-6 text-[10px]" onClick={() => append({ label: "", value: "" })}>
          + Add Option
        </Button>
      </div>
      {fields.map((item, idx) => (
        <div key={item.id} className="flex gap-2 items-center">
          <Input placeholder="Label Option View" {...register(`${namePrefix}.options.${idx}.label`)} className="h-7 text-xs flex-1" />
          <Input placeholder="Value Option Saved" {...register(`${namePrefix}.options.${idx}.value`)} className="h-7 text-xs flex-1" />
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(idx)}>✕</Button>
        </div>
      ))}
    </div>
  );
}

function NestedItemSchemaBuilder({ namePrefix }: { namePrefix: string }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: `${namePrefix}.itemSchema` });

  return (
    <div className="pt-3 border-t space-y-3 pl-4 border-l-2 border-blue-500/40 bg-muted/10 p-2 rounded-r-md">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Array Element Schema Context Template</span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="h-6 text-[10px]"
          onClick={() => append({ key: "", label: "", type: "string" })}
        >
          + Add Sub-Field
        </Button>
      </div>

      {fields.map((item, idx) => (
        <FieldCard 
          key={item.id} 
          index={idx} 
          onRemove={() => remove(idx)} 
          namePrefix={`${namePrefix}.itemSchema.${idx}`} 
        />
      ))}
    </div>
  );
}