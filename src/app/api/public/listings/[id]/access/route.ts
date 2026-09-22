import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const ACCESS_COOKIE_PREFIX = "listing_public_";
const JWT_SECRET = process.env.JWT_SECRET!;

function cookieName(id: string) {
    return `${ACCESS_COOKIE_PREFIX}${id}`;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const body = await req.json();
        const password = body.password;

        if (!password) {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        const result = await db.query(
            `
            SELECT
                id,
                public_access,
                public_password_hash
            FROM listings
            WHERE id = $1
            LIMIT 1
            `,
            [id]
        );

        const listing = result.rows[0];

        if (!listing || !listing.public_access) {
            return NextResponse.json(
                { error: "Public access is not available" },
                { status: 404 }
            );
        }

        if (!listing.public_password_hash) {
            return NextResponse.json(
                { error: "Public access is not configured" },
                { status: 403 }
            );
        }

        const valid = await bcrypt.compare(
            password,
            listing.public_password_hash
        );

        if (!valid) {
            return NextResponse.json(
                { error: "Invalid password"},
                { status: 401 },
                
            );
        }

        const token = jwt.sign(
            {
                listingId: id,
                purpose: "listing-public-edit",
            },
            JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        const response = NextResponse.json({
            success: true,
        });

        response.cookies.set(
            `listing_public_${id}`,
            token,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: `/`,
                maxAge: 60 * 60 * 24 * 7,
            }
        );

        return response;
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Unable to authenticate" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const response = NextResponse.json({ success: true });

        response.cookies.set({
            name: cookieName(id),
            value: "",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
            expires: new Date(0),
        });

        return response;
    } catch (error) {
        console.error("Public listing logout error:", error);
        return NextResponse.json(
            { error: "Unable to log out" },
            { status: 500 }
        );
    }
}