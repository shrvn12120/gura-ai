"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";


type Props = {
  initialData?: any;
  mode?: "create" | "edit";
  onSuccess?: () => void;
};

export default function ListingForm({
  initialData,
  mode = "create",
  onSuccess,
}: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<any>(
    initialData || {
      islandId: "6a2b3316882b534c9d608058",

      name: "",
      slug: "",
      category: "guest-houses",
      subCategory: "accommodation",

      description: "Details will be available once final listing is published",

      photos: [],

      address: "",

      location: {
        lat: "",
        lng: "",
      },

      contact: {
        phone: "",
        whatsapp: "",
        email: "",
        website: "",
      },

      pricing: {
        base: "",
      },

      attributes: {},

      aiTags: "",

      featured: false,
    }
  );
  function update(key: string, value: any) {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateNested(group: string, key: string, value: any) {
    setForm((prev: any) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  }

  async function handleSubmit() {
    setLoading(true)
    const payload = {
      ...form,
      aiTags: form.aiTags
        ? form.aiTags.split(",").map((t: string) => t.trim())
        : [],
    };

    const res = await fetch("/api/listings",
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      toast.success(mode === "create" ? "Created" : "Updated");
      onSuccess?.();
      setLoading(false)
      setTimeout(()=>{
         router.push("/admin/listings")
      },100)
    } else {
      toast.error("Error saving listing");
    }
  }

  async function deleteListing(id: string) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this listing?"
  );

  if (!confirmed) return;

  const res = await fetch(`/api/listings/?id=${id}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    toast.error(data.message || "Failed to delete");
    return;
  }

  toast("Listing deleted");
  router.push("/admin/listings")

}

  return (
    <div className="space-y-6">

      {/* BASIC INFO */}
      <Card className="pp-4 py-10  space-y-3">
        <CardHeader>
            <CardTitle>BASIC INFO</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-6">
        <div className="space-y-2">
            <Label>Name</Label>
        <Input
          placeholder="Name"
          value={form.name}
          onChange={(e) => {
            update("name", e.target.value)
            update("slug", e.target.value.toLowerCase().split(" ").join("-"))
          }}
        />
        </div>
        
<div className="space-y-2">
            <Label>Slug</Label>
        <Input
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => update("slug", e.target.value)}
        />
        </div>


<div className="flex flex-col md:flex-row gap-4">


<div className="space-y-2">
            <Label>Category</Label>
        <Select defaultValue={form.category} onValueChange={(e) => update("category", e)}>
      <SelectTrigger className="w-full ">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger >
      <SelectContent >
        <SelectGroup >
          <SelectLabel>Category</SelectLabel>

          {
            CATEGORIES.map((category, index)=>(
                <SelectItem key={index} value={category.name}>{category.label}</SelectItem>
            ))
          }

        </SelectGroup>
      </SelectContent>
    </Select>
    </div>
        
<div className="space-y-2">
            <Label>Sub Category</Label>
        <Input
          placeholder="Sub Category"
          value={form.subCategory}
          onChange={(e) => update("subCategory", e.target.value)}
        />
        </div>
</div>
<div className="space-y-2">
            <Label>Description</Label>
        <Textarea
          placeholder="Description"
          className="min-h-52"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
        </div>
        </CardContent>
      </Card>

      {/* CONTACT */}
      <Card className="p-4 py-10  space-y-3">
        <CardHeader>
            <CardTitle>CONTACT INFO</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-6">
 <div className="space-y-2">
            <Label>Phone</Label>
        <Input
          placeholder="Phone"
          value={form?.contact?.phone}
          onChange={(e) =>
          {
            updateNested("contact", "phone", e.target.value)
            updateNested("contact", "whatsapp", e.target.value)
          }
          }
        />
        </div>
 <div className="space-y-2">
            <Label>WhatsApp</Label>
        <Input
          placeholder="WhatsApp"
          value={form?.contact?.whatsapp}
          onChange={(e) =>
            updateNested("contact", "whatsapp", e.target.value)
          }
        />
        </div>
 <div className="space-y-2">
            <Label>Email</Label>
        <Input
          placeholder="Email"
          value={form?.contact?.email}
          onChange={(e) =>
            updateNested("contact", "email", e.target.value)
          }
        />
        </div>

         <div className="space-y-2">
            <Label>Website</Label>

        <Input
          placeholder="Website url"
          value={form?.contact?.website}
          onChange={(e) =>
            updateNested("contact", "website", e.target.value)
          }
        />
        </div>
        </CardContent>
      
      </Card>

      {/* LOCATION */}
      <Card className="p-4 py-10  space-y-3">
        <CardHeader>
            <CardTitle>LOCATION</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-6">
     
 <div className="space-y-2">
            <Label>Address</Label>
        <Input
          placeholder="Address"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
        />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 gap-y-6">
           <div className="space-y-2">
            <Label>Longitude</Label>
          <Input
            placeholder="Longitude"
            value={form?.location?.lng || ""}
            onChange={(e) =>
              updateNested("location", "lng", e.target.value)
            }
          />
          </div>
             <div className="space-y-2">
            <Label>Latitude</Label>
          <Input
            placeholder="Latitude"
            value={form?.location?.lat || ""}
            onChange={(e) =>
              updateNested("location", "lat", e.target.value)
            }
          />
          </div>

        </div>
        </CardContent>
      </Card>

      {/* AI SETTINGS */}
      <Card className="p-4 py-10  space-y-3">
       <CardHeader>
            <CardTitle>OTHERS</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-6">
     
 <div className="space-y-2">
            <Label>AI Tags</Label>

        <Input
          placeholder="AI Tags"
          value={form.aiTags}
          onChange={(e) => update("aiTags", e.target.value)}
        />
        </div>

        <div className="flex items-center justify-between border px-4 py-2 rounded-2xl">
          <span>Featured</span>
          <Switch
            checked={form.featured}
            onCheckedChange={(v) => update("featured", v)}
          />
        </div>
        </CardContent>
      </Card>

      {/* SUBMIT */}
      <div className="max-w-xl flex flex-col md:flex-row gap-4">
     
      <Button disabled={loading} className="w-full" onClick={handleSubmit}>
        {mode === "create" ? 
        <>
         {!loading ?"Create Listing" :"Creating..."}
        </>
        : 
        <>
         {!loading ?"Update Listing" :"Updating..."}
        </>
        }
       
      </Button>
      {
        mode === "edit" && initialData && (
            <Button disabled={loading}
            type="button"
            variant={"destructive"}
            className="w-full md:w-32"
            onClick={(()=>deleteListing(initialData._id))}
            >
                Delete
            </Button>
        )
      }
       </div>
    </div>
  );
}