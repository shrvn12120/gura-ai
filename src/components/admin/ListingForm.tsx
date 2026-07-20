"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Shadcn UI Components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Icons
import { Loader2, Plus, Save, Trash } from "lucide-react";
import { Separator } from "../ui/separator";
import { getDefaultMeta, MetaField, Social } from "@/lib/categories.config";
import { ApiAttachmentUploader } from "./ImageKitAttachmentUploader";


//  CATEGORY_SUBCATEGORY_META_CONFIGS,
export type ListingFormData = {
    _id?: string; // Optional MongoDB Document ID used for editing routing tracks
    title: string;
    slug: string;
    category: string;
    subCategory: string;
    description: string;
    contact_info: {
        address?: string;
        phone?: string;
        email?: string;
        whatsapp?: string;
        socials?: {
            name: string;
            link: string;
        }[];
        coordinates?: {
            lat: string;
            lng: string;
        }
    },
    images: { id: string; url: string, alt: string }[];
    metadata: Record<string, MetaField>;
    active: boolean
};

interface ListingFormProps {
    initialData?: ListingFormData;
    categories:  Record<string, Record<string, MetaField[]>>
}


export default function ListingForm({ initialData, categories }: ListingFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const isEditMode = !!initialData?._id;

    const [form, setForm] = useState<ListingFormData>(() => {
        if (initialData) {
            return {
                ...initialData,
                images: Array.isArray(initialData.images) && initialData.images.length > 0
                    ? initialData.images
                    : [],
                metadata: initialData.metadata || {},
                socials: initialData.contact_info?.socials || [],
            };
        }
        return {
            title: "",
            slug: "",
            category: "food-and-beverage",
            subCategory: "restaurant",
            description: "",
            contact_info: {
                address: "",
                phone: "",
                email: "",
                whatsapp: "",
                socials: [
                    { name: "", link: "" }
                ],
                coordinates: { lat: "", lng: "" },
            },
            images: [],
            metadata: getDefaultMeta("food-and-beverage", "default"),
            active: false
        };
    });


    function update(key: any, value: any) {
        setForm((prev) => {
            const updated: any = { ...prev, [key]: value };

            if (key === "category") {
                updated.subCategory = "default";
                updated.metadata = getDefaultMeta(value, "default");
            }

            if (key === "subCategory") {
                updated.metadata = getDefaultMeta(prev.category, value);
            }

            return updated;
        });
    }

    function updateMeta(key: string, value: any) {
        setForm((prev) => ({
            ...prev,
            metadata: { ...prev.metadata, [key]: value },
        }));
    }



    function updateImage(index: number, field: "id" | "url" | "alt", value: string) {
        setForm((prev) => {
            const images = [...prev.images];
            images[index] = { ...images[index], [field]: value };
            return { ...prev, images };
        });
    }

    function removeImage(index: number) {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, imageIndex) => imageIndex !== index),
        }));
    }

    /* ---------------- SOCIALS ---------------- */

    function addSocial() {
        setForm((prev) => ({
            ...prev,
            contact_info: {
                ...prev.contact_info,
                socials: [...(prev.contact_info.socials || []), { name: "", link: "" }],
            },
        }));
    }

    function updateSocial(index: number, field: keyof Social, value: string) {
        setForm((prev) => {
            const socials = [...prev?.contact_info?.socials || [{ name: "", link: "" }]];
            socials[index][field] = value;

            return {
                ...prev,
                contact_info: { ...prev.contact_info, socials },
            };
        });
    }

    function removeSocial(index: number) {
        setForm((prev) => ({
            ...prev,
            contact_info: {
                ...prev.contact_info,
                socials: prev?.contact_info?.socials?.filter((_, i) => i !== index),
            },
        }));
    }

    async function submit() {
        try {
            setLoading(true);

            const payload = {
                ...form,
                images: form.images || [],
            };

            // Select PUT strategy if editing an existing ID, otherwise default to POST creation block
            const endpoint = isEditMode ? `/api/listings/${form._id}` : "/api/listings";
            const method = isEditMode ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Failed to process listing via ${method}`);

            router.push("/admin/listings");
            setForm({
               title: "",
            slug: "",
            category: "food-and-beverage",
            subCategory: "restaurant",
            description: "",
            contact_info: {
                address: "",
                phone: "",
                email: "",
                whatsapp: "",
                socials: [
                    { name: "", link: "" }
                ],
                coordinates: { lat: "", lng: "" },
            },
            images: [],
            metadata: getDefaultMeta("food-and-beverage", "default"),
            active: false
            })
            
        } catch (err) {
            console.error(err);
            alert(isEditMode ? "Error updating listing" : "Error creating listing");
        } finally {
            setLoading(false);
        }


      
    }





function isBooleanField(field: MetaField): field is Extract<MetaField, { type: "boolean" }> {
  return field.type === "boolean";
}

function isStringField(field: MetaField): field is Extract<MetaField, { type: "string" | "number" | "textarea" }> {
  return field.type === "string" || field.type === "number" || field.type === "textarea";
}

function isSelectField(field: MetaField): field is Extract<MetaField, { type: "select" }> {
  return field.type === "select";
}

function isArrayField(field: MetaField): field is Extract<MetaField, { type: "array" }> {
  return field.type === "array";
}

function getPrimitiveValue(value: any) {
  if (typeof value === "string" || typeof value === "number") return value;
  return "";
}

const defaultFields = categories?.[form.category]?.default || [];
const subCategoryFields = categories?.[form.category]?.[form.subCategory] || [];



// Merges both arrays and filters out exact duplicate items
const dynamicFields = Array.from(new Set([...defaultFields, ...subCategoryFields]));
const booleanFields = dynamicFields.filter(isBooleanField);
const otherFields = dynamicFields.filter((f) => !isBooleanField(f));


    return (
        <div className="max-w-8xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        {isEditMode ? "Update Listing" : "Create Listing"}
                    </CardTitle>
                    <CardDescription>
                        {isEditMode ? "Modify entry field parameters below." : "Fill out details below to inject a new property profile."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Basic Details */}
                    <Card className="bg-muted/40">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base font-semibold">Basic Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                          <div  onClick={() => update("active", !form.active)} className={`rounded-xl w-32 cursor-pointer transition-all border  ${
                form.active ? "border bg-primary/5" : ""
              }`}>
                <div  className="flex items-center justify-between p-4">
                  <Label
                            className="cursor-pointer font-medium"
                            >
                 {form?.active? "Active":"Inactive"}
                </Label>

                <Checkbox
                  checked={form?.active || false}
                  onCheckedChange={(checked) =>
                    update("active", !!checked)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
                </div>
                            
                
                          </div>
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Blue Lagoon Villa"
                                            value={form.title}
                                            onChange={(e) =>{
                                                update("title", e.target.value)
                                                update("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug</Label>
                                        <Input
                                            id="slug"
                                            placeholder="blue-lagoon"
                                            value={form.slug}
                                            disabled // Lock slugs during edits to preserve indexing tracks
                                            className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
                                            onChange={(e) => update("slug", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        
                                        <Select value={form.category} onValueChange={(v) => update("category", v)}>
                                            <SelectTrigger className="w-full" id="category">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                               {Object.keys(categories)
  .sort((a, b) => a.localeCompare(b))
  .map((c) => (
    <SelectItem key={c} value={c}>
      {c
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")}
    </SelectItem>
  ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Sub Category</Label>
                                       
                                        <Select value={form.subCategory} onValueChange={(v) => update("subCategory", v)}>
                                            <SelectTrigger className="w-full" id="subCategory">
                                                <SelectValue placeholder="Sub Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(
                                                    categories?.[form.category] || {}
                                                ).sort((a, b) => a.localeCompare(b)).map((sc) => (
                                                    <SelectItem key={sc} value={sc}>
                                                  
                                                         {sc.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe your listing..."
                                        className="min-h-25"
                                        value={form.description}
                                        onChange={(e) => update("description", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Separator />

                    <Card className="bg-muted/40">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base font-semibold">Contact & Location Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            placeholder="e.g. 123 Beach Road, Guraidhoo"
                                            value={form.contact_info.address}
                                            onChange={(e) => update("contact_info", { ...form.contact_info, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            placeholder="e.g. info@company.com"
                                            value={form.contact_info.email}
                                            onChange={(e) => update("contact_info", { ...form.contact_info, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+960 123 4567"
                                            value={form.contact_info.phone}
                                            onChange={(e) => update("contact_info", { ...form.contact_info, phone: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp">WhatsApp</Label>
                                        <Input
                                            id="whatsapp"
                                            placeholder="+960 123 4567"
                                            value={form.contact_info.whatsapp}
                                            onChange={(e) => update("contact_info", { ...form.contact_info, whatsapp: e.target.value })}
                                        />
                                    </div>

                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="lat">Latitude</Label>
                                        <Input
                                            id="lat"
                                            placeholder="e.g. 3.7900"
                                            value={form.contact_info.coordinates?.lat || ""}
                                            onChange={(e) => {
                                                
                                                update("contact_info", {
                                                    ...form.contact_info,
                                                    coordinates: { ...form.contact_info.coordinates, lat: e.target.value },
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lng">Longitude</Label>
                                        <Input
                                            id="lng"
                                            placeholder="e.g. 73.2600"
                                            value={form.contact_info.coordinates?.lng || ""}
                                            onChange={(e) => {
                                                const lng = parseFloat(e.target.value);
                                                update("contact_info", {
                                                    ...form.contact_info,
                                                    coordinates: { ...form.contact_info.coordinates, lng: e.target.value },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* SOCIALS */}
                            <div className="space-y-2">
                                <Label>Social Links</Label>

                                {form?.contact_info?.socials?.map((s, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input
                                            placeholder="Name"
                                            value={s.name}
                                            onChange={(e) => updateSocial(i, "name", e.target.value)}
                                        />
                                        <Input
                                            placeholder="Link"
                                            value={s.link}
                                            onChange={(e) => updateSocial(i, "link", e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => removeSocial(i)}
                                        >
                                            <Trash />
                                        </Button>
                                    </div>
                                ))}



                                <Button type="button" variant="outline" size="sm" onClick={addSocial}>
                                    <Plus /> Add Social
                                </Button>
                            </div>




                        </CardContent>
                    </Card>
                    <Separator />




                    {/*  Media */}


                    <Card className="bg-muted/40">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base font-semibold">Images</CardTitle>
                        </CardHeader>
                        <CardContent className=" p-4 pt-0 space-y-4">
                           <ApiAttachmentUploader
  // Maps your parent form state to the exact ImageItem format required
  current={form.images.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
  }))}
  
  onUploadComplete={(newUploadedFiles) => {
    newUploadedFiles.forEach((file, batchIndex) => {
      const nextIndex = form.images.length + batchIndex;
      updateImage(nextIndex, "id", file.id);
      updateImage(nextIndex, "url", file.url);
      updateImage(nextIndex, "alt", file.alt); // Instantiates an empty string entry
    });
  }}
  
  onImageDelete={(deletedFileInfo) => {
    const targetIndex = form.images.findIndex((img) => img.id === deletedFileInfo.id);
    if (targetIndex !== -1) {
      removeImage(targetIndex);
    }
  }}
  
  onAltChange={(id, updatedAltText) => {
    // Finds the index using the ID and pushes modifications directly to state
    const targetIndex = form.images.findIndex((img) => img.id === id);
    if (targetIndex !== -1) {
      updateImage(targetIndex, "alt", updatedAltText);
    }
  }}
/>
                        </CardContent>
                    </Card>


                    <Separator />
                   


 <div className="space-y-6">
   
{otherFields.map((field) => {
   const value = form.metadata?.[field.key];



 
  /* ---------------- STRING / NUMBER / TEXTAREA ---------------- */
  if (isStringField(field)) {
    return (
        <React.Fragment key={field.key}>
      <Card  className="bg-muted/40">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <Label className="text-base font-medium">{field.label}</Label>

            {field.placeholder && (
              <p className="text-sm text-muted-foreground">
                {field.placeholder}
              </p>
            )}
          </div>

          {field.type === "textarea" ? (
            <Textarea
              rows={5}
              className="resize-y"
              value={getPrimitiveValue(value)}
              placeholder={field.placeholder}
              onChange={(e) => updateMeta(field.key, e.target.value)}
            />
          ) : (
            <Input
              type={field.type === "number" ? "number" : "text"}
              value={getPrimitiveValue(value)}
              placeholder={field.placeholder}
              onChange={(e) =>
                updateMeta(
                  field.key,
                  field.type === "number"
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
            />
          )}
        </CardContent>
      </Card>
      </React.Fragment>
    );
  }

  /* ---------------- SELECT ---------------- */
  if (isSelectField(field)) {
    const rawValue = form.metadata?.[field.key];

    return (
        <React.Fragment key={field.key}>
             <Card  className="bg-muted/40">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <Label className="text-base font-medium">{field.label}</Label>
          </div>

          <Select
            value={typeof rawValue === "string" ? rawValue : ""}
            onValueChange={(v) => updateMeta(field.key, v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>

            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
            <Separator />
        </React.Fragment>
     
    );
  }

  /* ---------------- ARRAY ---------------- */
  if (isArrayField(field)) {
    const arr = Array.isArray(value) ? value : [];

    return (
        <React.Fragment key={field.key}>
             <Card  className="bg-muted/40">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">{field.label}</Label>
              <p className="text-sm text-muted-foreground">
                Add one or more {field.label.toLowerCase()}.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const empty: any = {};

                field.itemSchema.forEach((f) => {
                  empty[f.key] =
                    f.type === "number"
                      ? 0
                      : f.type === "boolean"
                      ? false
                      : "";
                });

                updateMeta(field.key, [...arr, empty]);
              }}
            >
              + Add
            </Button>
          </div>

          {arr.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No {field.label.toLowerCase()} added yet.
            </div>
          )}

          <div className="space-y-4">
            {arr.map((item: any, index: number) => (
              <Card key={index} >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {field.label} #{index + 1}
                    </h4>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const updated = arr.filter(
                          (_: any, i: number) => i !== index
                        );
                        updateMeta(field.key, updated);
                      }}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {field.itemSchema.map((subField) => (
                      <div
                        key={subField.key}
                        className={
                          subField.type === "textarea"
                            ? "space-y-2 md:col-span-2"
                            : "space-y-2"
                        }
                      >
                        <Label>{subField.label}</Label>

                        {subField.type === "textarea" ? (
                          <Textarea
                            rows={3}
                            value={item[subField.key] ?? ""}
                            placeholder={subField.placeholder}
                            onChange={(e) => {
                              const updated = [...arr];

                              updated[index] = {
                                ...updated[index],
                                [subField.key]: e.target.value,
                              };

                              updateMeta(field.key, updated);
                            }}
                          />
                        ) : (
                          <Input
                            type={
                              subField.type === "number"
                                ? "number"
                                : "text"
                            }
                            value={item[subField.key] ?? ""}
                            placeholder={subField.label}
                            onChange={(e) => {
                              const updated = [...arr];

                              updated[index] = {
                                ...updated[index],
                                [subField.key]:
                                  subField.type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              };

                              updateMeta(field.key, updated);
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
<Separator/>
        </React.Fragment>
     
    );
  }

  return null;
})}

 {booleanFields.length > 0 && (
  <Card className="bg-muted/40">
    <CardHeader>
      <CardTitle>Features</CardTitle>
      <CardDescription>
        Select all applicable features.
      </CardDescription>
    </CardHeader>

    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {booleanFields.map((field) => {
          const value = form.metadata?.[field.key];

          return (
            <Card
              key={field.key}
              className={`cursor-pointer transition-all hover:border-primary ${
                value ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => updateMeta(field.key, !value)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <Label className="cursor-pointer font-medium">
                  {field.label}
                </Label>

                <Checkbox
                  checked={!!value}
                  onCheckedChange={(checked) =>
                    updateMeta(field.key, !!checked)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </CardContent>
  </Card>
)}
 </div>


                    {/* Submit Action */}
                    <Button onClick={submit} disabled={loading} className="w-full mt-4">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEditMode ? "Saving Changes..." : "Creating..."}
                            </>
                        ) : isEditMode ? (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Listing
                            </>
                        )}
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}