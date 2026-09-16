"use client";

import React from "react";

import {
    getDefaultMeta,
    MetaField,
} from "@/lib/categories.config";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface MetadataEditorProps {
    category: string;
    subCategory: string;
    metadata: Record<string, any>;
    onChange: (key: string, value: any) => void;
}

function isBooleanField(
    field: MetaField
): field is Extract<
    MetaField,
    { type: "boolean" }
> {
    return field.type === "boolean";
}

function isStringField(
    field: MetaField
): field is Extract<
    MetaField,
    {
        type:
            | "string"
            | "number"
            | "textarea";
    }
> {
    return (
        field.type === "string" ||
        field.type === "number" ||
        field.type === "textarea"
    );
}

function isSelectField(
    field: MetaField
): field is Extract<
    MetaField,
    { type: "select" }
> {
    return field.type === "select";
}

function isArrayField(
    field: MetaField
): field is Extract<
    MetaField,
    { type: "array" }
> {
    return field.type === "array";
}

function primitiveValue(value: any) {
    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return value;
    }

    return "";
}

export default function MetadataEditor({
    category,
    subCategory,
    metadata,
    onChange,
}: MetadataEditorProps) {
    const defaultFields =
        getDefaultMeta(category, "default");

    /*
     * Your actual categories.config is already used by
     * ListingForm. If you want the exact field definitions,
     * pass them into this component instead.
     */
    const fields = Object.values(
        metadata || {}
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Listing Details
                </CardTitle>

                <CardDescription>
                    Update the additional information about
                    this listing.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No additional information available.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Metadata fields are available based
                            on the listing category.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}