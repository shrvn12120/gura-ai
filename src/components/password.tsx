"use client"
import React, { useState } from "react";
import { Input } from "@/components/ui/input"; // adjust import path as needed

// Balanced strength: 8+ chars, 1 upper, 1 lower, 1 digit
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function PasswordInput({ form, update }:{ form: any; update: any }) {
    const [touched, setTouched] = useState(false);
    const isValid = PASSWORD_REGEX.test(form.publicPassword ?? "");

    return (
        <div className="space-y-1.5">
            <Input
                id="public-password"
                type="text"
                value={form.publicPassword ?? ""}
                onChange={(e) => {
                    update("publicPassword", e.target.value);
                    if (!touched) setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                placeholder="Enter password to share"
                className={touched && form.publicPassword && !isValid ? "border-destructive focus-visible:ring-destructive" : ""}
            />

            {touched && form.publicPassword && !isValid ? (
                <p className="text-sm font-medium text-destructive">
                    Password must be at least 8 characters long and contain uppercase, lowercase, and a number.
                </p>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Share this password with the person responsible for this listing. The password itself is never stored in the database.
                </p>
            )}
        </div>
    );
}