import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus } from "lucide-react"; // Optional: Adds a nice plus icon to your button
import { Separator } from "@/components/ui/separator";
import  { INotice } from "@/models/Notice";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { getAllNotices } from "@/app/action";



async function Informations() {
"use cache"

 const listings = await getAllNotices()
  return (
     


    <div className="w-full">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notice</h1>
          <p className="text-muted-foreground text-sm">
            Manage and view all your Notice.
          </p>
        </div>

        {/* Shadcn Button using standard Next.js Link via 'asChild' */}
        <Button asChild>
          <Link href="/admin/notice/new">
            <Plus className="mr-2 h-4 w-4" /> New Notice
          </Link>
        </Button>
      </div>

      <Separator className="mb-10 md:mb-20"/>

      {/* Listings Grid/List */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {listings?.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-10">
            No Notice is there yet. Create a new one to get started!
          </p>
        ) : (
          listings?.map((item: INotice) => (
            <Link key={item.id?.toString() || ""} href={`/admin/notice/${item.id}`}>
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer shadow-sm">
                <CardHeader>
                  <CardTitle className="line-clamp-1 text-lg">
                    {item.title} {
                      item.is_active? 
                      <Badge variant={"default"}>Active</Badge>:<Badge variant={"destructive"}>In Active</Badge>
                    }
                   
                  </CardTitle>
                  <CardDescription>
                     <div className="my-2">
                    {item.message}
                     </div>
                    
                    <br/>
                   

                    
                    <br/>
                    <p className="text-xs">Created at: {item.createdAt?.toDateString()}</p>
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
  
  )
}

export default async function Page() {



  return (
     <Suspense fallback={<div>Loading...</div>}>
   <Informations />
   </Suspense>
  );
}