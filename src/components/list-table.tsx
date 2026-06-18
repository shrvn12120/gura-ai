"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { CATEGORIES } from "@/lib/categories";

type Listing = {
  _id: string;
  name: string;
  category: string;
  isActive: boolean;
  featured?: boolean;
  subCategory: string
};

export default function ListingsTable({
  listings,
}: {
  listings?: Listing[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return listings?.filter((listing) => {
      const matchesSearch =
        listing.name
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "all"
          ? true
          : listing.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [listings, search, category]);

  return (
    <div className="space-y-4">
      {/* Filters */}

      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

       
        <Select
         value={category}
        onValueChange={(e) => setCategory(e)}
        >
            <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Categories</SelectLabel>
          <SelectItem value="all">All Categories</SelectItem>


            {
                      CATEGORIES.map((category, index)=>(
                          <SelectItem key={index} value={category.name}>{category.label}</SelectItem>
                      ))
                    }
        </SelectGroup>
      </SelectContent>

        </Select>
      </div>

      {/* Table */}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-25">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center"
                >
                  No listings found
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((listing) => (
                <TableRow key={listing._id}>
                  <TableCell className="font-medium">
                    {listing.name}
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {listing.category}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    <Badge variant="secondary">
                      {listing.subCategory}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        listing.isActive
                          ? "default"
                          : "destructive"
                      }
                    >
                      {listing.isActive
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {listing.featured ? "⭐" : "-"}
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/admin/listings/${listing._id}`}
                      className="text-sm underline"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered?.length} listing(s)
      </p>
    </div>
  );
}