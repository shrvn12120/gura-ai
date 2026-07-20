"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FilterX, Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// import { CATEGORY_SUBCATEGORY_META_CONFIGS } from "@/lib/categories.config";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {MetaField } from "@/lib/categories.config";

interface Listing {
    _id: string;
    title: string;
    category: string;
    subCategory?: string;
    active?: boolean
}

interface Props {
    listings: Listing[];
     categories:  Record<string, Record<string, MetaField[]>>
}

export default function ListingsClient({ listings, categories }: Props) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [subCategory, setSubCategory] = useState("all");
    const [activeStatus, setActiveStatus] = useState("all")
    const CATEGORY_SUBCATEGORY_META_CONFIGS = categories

    const filteredListings = useMemo(() => {
        return listings.filter((item) => {

            const matchesSearch =
                search === "" ||
                item.title?.toLowerCase().includes(search.toLowerCase()) ||
                item.category?.toLowerCase().includes(search.toLowerCase()) ||
                item.subCategory?.toLowerCase().includes(search.toLowerCase());

        

            const matchesCategory =
                category === "all" || item.category === category;

            const matchesSubCategory =
                subCategory === "all" || item.subCategory === subCategory;

                        

            const matchesActiveStatus =
    activeStatus === "all" ||
    (activeStatus === "active" && item.active === true) ||
    (activeStatus === "inactive" && item.active === false);
            
            return matchesSearch && matchesCategory && matchesSubCategory && matchesActiveStatus;
        });
    }, [listings, search, category, subCategory, activeStatus]);

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center ">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Listings
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Manage and view all your current listings.
                    </p>
                </div>

                <Button asChild>
                    <Link href="/admin/listings/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Listing
                    </Link>
                </Button>
            </div>

            <Separator className="my-8" />

            {/* Search */}
            <div className="mb-6 grid gap-4 grid-cols-1 md:grid-cols-6 border p-4  rounded-2xl bg-card">
                {/* Search */}
                <div className="col-span-2  space-y-2">
                    <Label>Search by name</Label>
                    <Input

                        placeholder="Amore...."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>


                {/* Category */}
                <div className=" space-y-2">
                    <Label>Filter Category</Label>
                    <Select
                        value={category}
                        onValueChange={(value) => {
                            setCategory(value);
                            setSubCategory("all");
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>

                        <SelectContent className="w-72!">
                            <SelectItem value="all">All Categories</SelectItem>


                            {Object.keys(CATEGORY_SUBCATEGORY_META_CONFIGS)
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

                <div className=" space-y-2">
                    <Label>Filter Subcategory</Label>
                    {/* Subcategory */}
                    <Select
                        value={subCategory}
                        onValueChange={setSubCategory}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Subcategory" />
                        </SelectTrigger>

                        <SelectContent className="w-72">
                            <SelectItem value="all">All Subcategories</SelectItem>

                            {Object.keys(
                                CATEGORY_SUBCATEGORY_META_CONFIGS?.[category] || {}
                            ).sort((a, b) => a.localeCompare(b)).map((sc) => (
                                <SelectItem key={sc} value={sc}>

                                    {sc.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                                </SelectItem>
                            )).filter((i)=>i.key !== "default")}
                        </SelectContent>
                    </Select>
                </div>

                <div className=" space-y-2">
                    <Label>Active Status</Label>
                    {/* Subcategory */}
                    <Select
                        value={activeStatus}
                        onValueChange={setActiveStatus}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Active status" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full h-full flex items-end">
                    <Button variant={"outline"} className="border-destructive! text-destructive! w-full" onClick={(() => {
                        setSearch("")
                        setCategory("all")
                        setSubCategory("all")



                    })}>Clear <FilterX /></Button>
                </div>


            </div>

            {/* Results */}
            <p className="mb-4 text-sm text-muted-foreground">
                {filteredListings.length} listing
                {filteredListings.length !== 1 && "s"} found
            </p>

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredListings.length === 0 ? (
                    <p className="col-span-full py-10 text-center text-muted-foreground">
                        No listings found.
                    </p>
                ) : (
                    filteredListings.map((item) => (
                        <Link
                            key={item._id}
                            href={`/admin/listings/${item._id}`}
                        >
                            <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50 border border-dashed">
                                <CardHeader>
                                    <CardTitle className="line-clamp-1 flex justify-between">
                                        {item.title}
                                        {item?.active && item.active ? <Badge variant={"default"}>Active</Badge>:<Badge variant={"destructive"}>Inactive</Badge>}
                                    </CardTitle>

                                    <CardDescription>
                                        <span className="uppercase font-semibold tracking-wide text-muted-foreground text-xs">
                                            {item.category.split("-").join(" ")} {" "} ({item.subCategory && (
                                            <>
                                              
                                                <small className="">
                                                    {item.subCategory}
                                                </small>
                                            </>
                                        )})
                                        </span>

                                        
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <span className="text-xs text-muted-foreground">
                                        Click to view or edit details
                                    </span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}