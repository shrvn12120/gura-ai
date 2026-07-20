import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");


   async function createCategory() {

        if (!value.trim())
            return;


        const res =
            await fetch(
                `${process.env.NEXT_PUBLIC_URL}/api/meta-configs`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        category: value.split(" ").join("-").toLowerCase(),

                        subCategories: []

                    })

                }
            );



        setValue("");
        setOpen(false);

    }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={'sm'}>
         <Plus /> New Category
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="general information"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button onClick={createCategory}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}