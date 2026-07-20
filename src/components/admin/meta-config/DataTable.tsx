"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MoreHorizontal,
} from "lucide-react";

import { MetaConfig } from "./types";
import { CreateCategoryDialog } from "./CreateCategoryDialog";

interface Props {
  data: MetaConfig[];
  onDelete?: (id: string) => void;
}

export default function MetaConfigTable({
  data,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return data.filter((item) =>
      item.category
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className="space-y-8 my-8">
         <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Meta Configurations</CardTitle>
          <CardDescription>
            Manage categories and their schemas.
          </CardDescription>
        </div>
        <CreateCategoryDialog />
      </CardHeader>
      <CardContent>
<Input
          placeholder="Search category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardContent>
      </Card>

    <Card>
      <CardHeader className="sr-only">
       <CardTitle>Meta Configurations</CardTitle>
          <CardDescription>
            Manage categories and their schemas.
          </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-muted-foreground">Category</TableHead>
              <TableHead className="font-bold text-muted-foreground">Sub Categories</TableHead>
              <TableHead className="font-bold text-muted-foreground">Fields</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10"
                >
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.sort((a, b) =>
    a.category.localeCompare(b.category)
  ).map((config) => (
                <TableRow key={config._id} className="even:bg-accent/50">
                  <TableCell className="text-sm font-light capitalize">
                    {config.category.replaceAll("-", " ")}
                  </TableCell>

                  <TableCell>
                    {config.subCategories.length}
                  </TableCell>

                  <TableCell>
                    {config.subCategories.reduce(
                      (total, sub) =>
                        total + sub.fields.length,
                      0
                    )}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/config/meta-configs/${config._id}`}
                          >
                            Edit
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                        disabled
                          className="text-destructive"
                          onClick={() =>
                            onDelete &&   onDelete(config?._id || "")
                          }
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>
  );
}