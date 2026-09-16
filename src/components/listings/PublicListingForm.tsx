"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import { Social } from "@/lib/categories.config";
import { ApiAttachmentUploader } from "../admin/ImageKitAttachmentUploader";
import MetadataEditor from "./MetadataEditor";

type Listing = {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
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
    };
  };

  images: {
    id: string;
    url: string;
    alt: string;
  }[];

  metadata: Record<string, any>;
  active: boolean;
};

type Draft = {
  id: string;
  description: string;
  contact_info: Listing["contact_info"];
  images: Listing["images"];
  metadata: Record<string, any>;
  active: boolean;
  status: "pending" | "pending_review" | "approved" | "rejected";
  rejection_reason: string | null;
};

interface PublicListingFormProps {
  listing: Listing;
  draft: Draft | null;
  listingId: string;
  onDraftChange?: (draft: Draft | null) => void;
}

export default function PublicListingForm({
  listing,
  draft: initialDraft,
  listingId,
  onDraftChange,
}: PublicListingFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(initialDraft);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
const isPendingReview = draft?.status === "pending_review";
 const [form, setForm] = useState(() => ({
    // If pending review, display the draft values; otherwise (rejected/none), show live listing data
    description: isPendingReview
      ? (draft?.description ?? listing.description ?? "")
      : (listing.description ?? ""),

    contact_info: isPendingReview
      ? (draft?.contact_info ?? listing.contact_info ?? {})
      : (listing.contact_info ?? {}),

    images: isPendingReview
      ? (draft?.images ?? listing.images ?? [])
      : (listing.images ?? []),

    metadata: isPendingReview
      ? (draft?.metadata ?? listing.metadata ?? {})
      : (listing.metadata ?? {}),

    active: isPendingReview
      ? (draft?.active ?? listing.active ?? false)
      : (listing.active ?? false),
  }));

  function update(key: keyof typeof form, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateContact(key: keyof Listing["contact_info"], value: any) {
    setForm((prev) => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [key]: value,
      },
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
      const socials = [...(prev.contact_info.socials || [])];
      socials[index] = { ...socials[index], [field]: value };
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
        socials: prev.contact_info.socials?.filter((_, i) => i !== index) || [],
      },
    }));
  }

  function updateMeta(key: string, value: any) {
    setForm((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value },
    }));
  }

  async function saveDraft() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await fetch(`/api/public/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          contact_info: form.contact_info,
          images: form.images,
          metadata: form.metadata,
          active: form.active,
          mode: "draft",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to save draft.");
      }

      setDraft(data.data);
      if (onDraftChange) onDraftChange(data.data);
      setMessage("Your changes have been saved as a draft.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to save changes.");
    } finally {
      setLoading(false);
    }
  }

  async function submitForReview() {
    try {
      setSubmitLoading(true);
      setError("");
      setMessage("");

      const res = await fetch(`/api/public/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          contact_info: form.contact_info,
          images: form.images,
          metadata: form.metadata,
          active: form.active,
          mode: "review",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to submit for review.");
      }

      setDraft(data.data);
      if (onDraftChange) onDraftChange(data.data);
      setMessage("Your changes have been submitted for admin approval.");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to submit changes.");
    } finally {
      setSubmitLoading(false);
    }
  }

  const socials = form.contact_info.socials || [];

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Update Listing</h1>
        <p className="text-muted-foreground">
          Update the information for{" "}
          <span className="font-medium text-foreground">{listing.title}</span>
        </p>
      </div>

      {draft?.status === "pending_review" && (
        <Card className="mb-6 border-primary">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">Changes are awaiting approval</p>
              <p className="text-sm text-muted-foreground">
                An administrator needs to approve your changes before they become public.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {draft?.status === "rejected" && (
        <Card className="mb-6 border-destructive! bg-destructive/10">
          <CardContent className="flex items-start gap-3 p-4">
            <X className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Changes have been rejected</p>
              <p className="text-sm text-muted-foreground">
               Your last changes were rejected by an administrator. Please review the rejection reason and make necessary updates.
              </p>
              {draft?.rejection_reason && (
                <p className="mt-1 text-sm text-">
                  <span className="font-medium">Rejection Reason:</span> {draft.rejection_reason}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {draft?.status === "approved" && (
        <Card className="mb-6 border-primary! bg-primary/10">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-primary">Changes have been approved</p>
              <p className="text-sm text-muted-foreground">
               Your last changes have been approved and are now live.
              </p>
              
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Listing</CardTitle>
            <CardDescription>
              These details are managed by the administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={listing.title} disabled />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={listing.category} disabled />
            </div>
            <div className="space-y-2">
              <Label>Sub Category</Label>
              <Input value={listing.subcategory} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>
              Update the description of your business or service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-40"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={form.contact_info.address || ""}
                  onChange={(e) => updateContact("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.contact_info.email || ""}
                  onChange={(e) => updateContact("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.contact_info.phone || ""}
                  onChange={(e) => updateContact("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={form.contact_info.whatsapp || ""}
                  onChange={(e) => updateContact("whatsapp", e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  value={form.contact_info.coordinates?.lat || ""}
                  onChange={(e) =>
                    updateContact("coordinates", {
                      ...form.contact_info.coordinates,
                      lat: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  value={form.contact_info.coordinates?.lng || ""}
                  onChange={(e) =>
                    updateContact("coordinates", {
                      ...form.contact_info.coordinates,
                      lng: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label>Social Links</Label>
                <p className="text-sm text-muted-foreground">
                  Add your social media links.
                </p>
              </div>

              {socials.map((social, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Name"
                    value={social.name}
                    onChange={(e) => updateSocial(index, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Link"
                    value={social.link}
                    onChange={(e) => updateSocial(index, "link", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeSocial(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addSocial}>
                Add Social
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Add, remove, or update your listing images.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiAttachmentUploader
              current={form.images.map((img) => ({
                id: img.id,
                url: img.url,
                alt: img.alt,
              }))}
              onUploadComplete={(newFiles) => {
                setForm((prev) => ({
                  ...prev,
                  images: [
                    ...prev.images,
                    ...newFiles.map((file) => ({
                      id: file.id,
                      url: file.url,
                      alt: file.alt,
                    })),
                  ],
                }));
              }}
              onImageDelete={(deleted) => {
                const index = form.images.findIndex((img) => img.id === deleted.id);
                if (index !== -1) removeImage(index);
              }}
              onAltChange={(id, alt) => {
                const index = form.images.findIndex((img) => img.id === id);
                if (index !== -1) updateImage(index, "alt", alt);
              }}
            />
          </CardContent>
        </Card>

        <MetadataEditor
          category={listing.category}
          subCategory={listing.subcategory}
          metadata={form.metadata}
          onChange={updateMeta}
        />

        <Card>
          <CardHeader>
            <CardTitle>Listing Status</CardTitle>
            <CardDescription>
              Let the administrator know whether this listing should remain active.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="flex cursor-pointer items-center justify-between rounded-lg border p-4"
              onClick={() => update("active", !form.active)}
            >
              <div>
                <Label className="cursor-pointer">
                  {form.active ? "Active" : "Inactive"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {form.active
                    ? "This listing should be visible."
                    : "This listing should not be visible."}
                </p>
              </div>
              <Checkbox
                checked={form.active}
                onCheckedChange={(checked) => update("active", !!checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </CardContent>
        </Card>

        <div className=" rounded-xl border bg-card p-3 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              disabled={true}
              onClick={saveDraft}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Draft"
              )}
            </Button>

            <Button
              className="flex-1"
              disabled={loading || submitLoading || draft?.status === "pending_review"}
              onClick={submitForReview}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}