"use client";

import { useEffect, useState, useMemo } from "react";
import { diffWords } from "diff";
import { Check, X, Loader2, AlertCircle, ArrowRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PendingRevision = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_category: string;
  submitted_at: string;
  status: string;

  // Proposed Values
  description: string;
  contact_info: Record<string, any>;
  images: { id: string; url: string; alt?: string }[];
  metadata: Record<string, any>;
  active: boolean;

  // Original Values
  original_description: string;
  original_contact_info: Record<string, any>;
  original_images: { id: string; url: string; alt?: string }[];
  original_metadata: Record<string, any>;
  original_active: boolean;
};

// --- Word-Level Text Diff ---

function TextDiff({ original = "", proposed = "" }: { original?: string; proposed?: string }) {
  if (original === proposed) {
    return (
      <p className="text-sm whitespace-pre-wrap text-muted-foreground font-sans">
        {proposed || "(Empty)"}
      </p>
    );
  }

  const diffs = diffWords(original || "", proposed || "");

  return (
    <div className="rounded-lg border bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap font-sans">
      {diffs.map((part, index) => {
        if (part.added) {
          return (
            <mark
              key={index}
              className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium px-0.5 rounded no-underline"
            >
              {part.value}
            </mark>
          );
        }

        if (part.removed) {
          return (
            <del
              key={index}
              className="bg-destructive/20 text-destructive line-through px-0.5 rounded decoration-destructive/80"
            >
              {part.value}
            </del>
          );
        }

        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
}

// --- Formatted Object/Nested Text Diff ---

function formatAsReadableText(data: any): string {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return "";
  }

  if (typeof data === "string") return data;

  try {
    return JSON.stringify(data, null, 2)
      .replace(/[{}["\]]/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  } catch {
    return String(data);
  }
}

function ObjectDiff({
  original = {},
  proposed = {},
}: {
  original?: Record<string, any>;
  proposed?: Record<string, any>;
}) {
  const origText = useMemo(() => formatAsReadableText(original), [original]);
  const propText = useMemo(() => formatAsReadableText(proposed), [proposed]);

  if (!origText && !propText) {
    return <p className="text-xs text-muted-foreground italic">No data</p>;
  }

  return <TextDiff original={origText} proposed={propText} />;
}

// --- Image Gallery Diff ---

function ImageDiff({
  original = [],
  proposed = [],
}: {
  original?: { id: string; url: string; alt?: string }[];
  proposed?: { id: string; url: string; alt?: string }[];
}) {
  const origList = original || [];
  const propList = proposed || [];

  const origIds = new Set(origList.map((img) => img.id || img.url));
  const propIds = new Set(propList.map((img) => img.id || img.url));

  const allImages = useMemo(() => {
    const combined = [...propList];
    origList.forEach((img) => {
      const id = img.id || img.url;
      if (!propIds.has(id)) combined.push(img);
    });
    return combined;
  }, [origList, propList, propIds]);

  if (allImages.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No images attached</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {allImages.map((img, idx) => {
        const id = img.id || img.url;
        const isAdded = !origIds.has(id) && propIds.has(id);
        const isRemoved = origIds.has(id) && !propIds.has(id);

        return (
          <div
            key={id || idx}
            className={`relative rounded border p-1.5 text-xs overflow-hidden ${
              isAdded
                ? "border-emerald-500 bg-emerald-500/10"
                : isRemoved
                ? "border-destructive bg-destructive/10 opacity-60"
                : "border-border bg-background"
            }`}
          >
            <div className="aspect-video w-full bg-muted rounded overflow-hidden flex items-center justify-center relative">
              {img.url ? (
                // eslint-disable-next-next/no-img-element
                <img src={img.url} alt={img.alt || ""} className="object-cover w-full h-full" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-1">
              <span className="truncate text-[10px] text-muted-foreground">{img.alt || "No caption"}</span>
              {isAdded && <Badge className="text-[9px] bg-emerald-600 px-1 py-0 h-4">Added</Badge>}
              {isRemoved && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">Removed</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Page Component ---

export default function AdminRevisionsPage() {
  const [revisions, setRevisions] = useState<PendingRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [selectedRevision, setSelectedRevision] = useState<PendingRevision | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

    useEffect(() => {
    fetchRevisions();
  }, []);

  async function fetchRevisions() {
    try {
      setLoading(true);
      const res = await fetch("/api/revisions");
      const data = await res.json();
      if (res.ok) {
        setRevisions(data.revisions || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending revisions:", err);
    } finally {
      setLoading(false);
    }
  }





  async function handleApprove(revisionId: string) {
    try {
      setActionLoading(revisionId);
      const res = await fetch(`/api/revisions/${revisionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve revision");
      }

      setRevisions((prev) => prev.filter((r) => r.id !== revisionId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectConfirm() {
    if (!selectedRevision) return;

    try {
      setActionLoading(selectedRevision.id);
      const res = await fetch(`/api/revisions/${selectedRevision.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject revision");
      }

      setRevisions((prev) => prev.filter((r) => r.id !== selectedRevision.id));
      setRejectDialogOpen(false);
      setSelectedRevision(null);
      setRejectReason("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pending Revision Reviews</h1>
          <p className="text-muted-foreground">
            Review user-submitted updates with inline text diffing before publishing.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {revisions.length} Pending
        </Badge>
      </div>

      {revisions.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No pending revisions</h3>
          <p className="text-sm text-muted-foreground">
            All submitted updates have been reviewed.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {revisions.map((rev) => {
            const isStatusChanged = rev.active !== rev.original_active;

            return (
              <Card key={rev.id} className="border-2 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40">
                  <div>
                    <CardTitle className="text-lg">{rev.listing_title}</CardTitle>
                    <CardDescription>
                      Submitted {new Date(rev.submitted_at).toLocaleString()} | Category: {rev.listing_category}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      disabled={actionLoading === rev.id}
                      onClick={() => {
                        setSelectedRevision(rev);
                        setRejectDialogOpen(true);
                      }}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                    <Button
                      disabled={actionLoading === rev.id}
                      onClick={() => handleApprove(rev.id)}
                    >
                      {actionLoading === rev.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      Approve & Publish
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Status Change Indicator */}
                  {isStatusChanged && (
                    <div className="rounded-lg border p-3 bg-amber-500/10 border-amber-500/30 flex items-center justify-between text-sm">
                      <span className="font-semibold text-amber-800 dark:text-amber-200">
                        Visibility Status Changed
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rev.original_active ? "Active" : "Inactive"}</Badge>
                        <ArrowRight className="h-4 w-4" />
                        <Badge className={rev.active ? "bg-emerald-600" : "bg-destructive"}>
                          {rev.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Description Diff */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description Changes
                    </h4>
                    <TextDiff
                      original={rev.original_description}
                      proposed={rev.description}
                    />
                  </div>

                  {/* Contact Info Diff */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Contact Info Changes
                    </h4>
                    <ObjectDiff
                      original={rev.original_contact_info}
                      proposed={rev.contact_info}
                    />
                  </div>

                  {/* Metadata Diff */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Metadata Changes
                    </h4>
                    <ObjectDiff
                      original={rev.original_metadata}
                      proposed={rev.metadata}
                    />
                  </div>

                  {/* Image Gallery Diff */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Image Gallery Changes
                    </h4>
                    <ImageDiff
                      original={rev.original_images}
                      proposed={rev.images}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing Revision</DialogTitle>
            <DialogDescription>
              Provide an optional reason for rejecting the changes submitted for{" "}
              <span className="font-semibold">{selectedRevision?.listing_title}</span>.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Reason for rejection (e.g., invalid phone number, incorrect details)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={actionLoading === selectedRevision?.id}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}