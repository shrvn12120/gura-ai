import { Separator } from "@/components/ui/separator";

export default async function AdminPage() {

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Manage and view all your current property or item listings.
          </p>
        </div>

        {/* Shadcn Button using standard Next.js Link via 'asChild' */}
        {/* <Button asChild>
          <Link href="/admin/listings/new">
            <Plus className="mr-2 h-4 w-4" /> New Listing
          </Link>
        </Button> */}

      </div>
       <Separator/>
    </div>
  );
}