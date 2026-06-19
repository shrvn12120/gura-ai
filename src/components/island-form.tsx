"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateIsland } from "@/app/action";
import { toast } from "sonner";

interface IslandFormProps {
  island: {
    _id: string
    name: string;
    slug: string;
    description?: string;
    heroImage?: string;
    location?: {
      lat?: number;
      lng?: number;
    };
    country?: string;
    timezone?: string;
    isActive?: boolean;
  };
}

export default function IslandForm({ island }: IslandFormProps) {
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: island.name || "",
    slug: island.slug || "",
    description: island.description || "",
    heroImage: island.heroImage || "",
    location: {
 lat: island.location?.lat || 0,
    lng: island.location?.lng || 0,
    },
   
    country: island.country || "Maldives",
    timezone: island.timezone || "Indian/Maldives",
    isActive: island.isActive ?? true,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };



  const handleSubmit = async () => {
    startTransition(async () => {

     const result = await updateIsland(island._id, formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast("Updated successfully");
    });
     
  };

  return (
    <form
      
      className="max-w-4xl space-y-6 bg-card p-8 rounded-2xl"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Name
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Slug
          </label>
          <Input
            name="slug"
            value={formData.slug}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Description
        </label>

        <Textarea
          name="description"
          rows={5}
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Hero Image URL
        </label>

        <Input
          name="heroImage"
          value={formData.heroImage}
          onChange={handleChange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Latitude
          </label>

          <Input
            type="number"
            step="any"
            name="lat"
            value={formData.location.lat}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Longitude
          </label>

          <Input
            type="number"
            step="any"
            name="lng"
            value={formData.location.lng}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Country
          </label>

          <Input
            name="country"
            value={formData.country}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Timezone
          </label>

          <Input
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
          />
        </div>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
        />
        <span className="text-sm">Active</span>
      </label>

      <Button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}