"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


interface Props {

value:string;

onChange:
(value:string)=>void;

onSubmit:
()=>void;

}



export default function CategoryForm({
value,
onChange,
onSubmit
}:Props){


return (

<div className="flex gap-2">


<Input

placeholder="Category name"

value={value}

onChange={
e=>onChange(e.target.value)
}

/>


<Button
onClick={onSubmit}
>
Create
</Button>


</div>

);

}