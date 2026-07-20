"use client";

import { useEffect, useState } from "react";

import CategoryForm from "./CategoryForm";
import SubCategoryList from "./SubCategoryList";

import {
    MetaConfig,
    SubCategory
} from "./types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
interface Props {
    initialData: MetaConfig[];
}


export default function MetaConfigBuilder({
    initialData
}: Props) {


    const [configs, setConfigs] =
        useState<MetaConfig[]>(
            initialData
        );


    const [selected, setSelected] =
        useState<MetaConfig | null>(null);


    const [category, setCategory] =
        useState("");






    // THIS WAS MISSING

    async function createCategory(
        categoryName: string
    ) {

        if (!categoryName.trim())
            return;


        const res =
            await fetch(
                "/api/meta-configs",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        category: categoryName,

                        subCategories: []

                    })

                }
            );



        const data =
            await res.json();



        setConfigs(prev => [
            ...prev,
            data
        ]);



        setSelected(data);



        setCategory("");

    }





    async function updateSubCategories(
        subCategories: SubCategory[]
    ) {

        if (!selected)
            return;


        const res =
            await fetch(
                `/api/meta-configs/${selected._id}`,
                {

                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        action: "REPLACE_SUBCATEGORIES",

                        data: {
                            subCategories
                        }

                    })

                }

            );



        const updated =
            await res.json();



        setSelected(updated);



        setConfigs(prev =>
            prev.map(item =>
                item._id === updated._id
                    ? updated
                    : item
            )
        );


    }






    return (

        <div className="w-full flex flex-col md:flex-row gap-8">


            <div className="w-auto bg-accent p-4 rounded-2xl">


                <CategoryForm

                    value={category}

                    onChange={
                        (value: string) =>
                            setCategory(value)
                    }

                    onSubmit={() =>
                        createCategory(category)
                    }

                />
<Separator className="mt-5"/>

<ScrollArea className="min-h-fit max-h-100 ">
             <div className="mt-5 space-y-2 space-x-2">
                    {
                        configs.map(config => (
<Button variant={"outline"} asChild>
<Link  className="capitalize" href={`/admin/config/meta-configs/${config._id}`}>{config.category.split("-").join(" ")}</Link>
</Button>
                        ))
                    }


                </div>
</ScrollArea>

            </div>





            <div className="w-4/5">


                {
                    selected &&

                    <SubCategoryList
                    selectedCategory={selected.category.split("-").join(" ")}

                        items={
                            selected.subCategories
                        }

                        onChange={
                            updateSubCategories
                        }

                    />

                }


            </div>



        </div>

    );

}