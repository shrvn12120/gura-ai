"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Save, Trash } from "lucide-react";
import { INotice, NoticePriority, NoticeType } from "@/models/Notice";



interface NoticeFormProps {
    initialData?: INotice;
}


export default function NoticeForm({ initialData }: NoticeFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const isEditMode = !!initialData?.id;

    const [form, setForm] = useState<INotice>({
        id: initialData?.id || "",
        title: initialData?.title || "",
        message: initialData?.message || "",
        type: initialData?.type || "announcement" as NoticeType,
        priority: initialData?.priority || "low" as NoticePriority,
        is_active: initialData?.is_active || false,
    });


    function update(key: any, value: any) {
        setForm((prev) => {
            const updated: any = { ...prev, [key]: value };
            return updated;
        });
    }

    async function submit() {
        try {
            setLoading(true);

            // Select PUT strategy if editing an existing ID, otherwise default to POST creation block
            const endpoint = isEditMode ? `/api/notices/${initialData.id}` : "/api/notices";
            const method = isEditMode ? "PATCH" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error(`Failed to process listing via ${method}`);

            router.push("/admin/notice");
            router.refresh();
        } catch (err) {
            console.error(err);
            alert(isEditMode ? "Error updating listing" : "Error creating listing");
        } finally {
            setLoading(false);
        }


      
    }


    return (
        <div className="max-w-8xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        {isEditMode ? "Update Notice" : "Create Notice"}
                    </CardTitle>
                    <CardDescription>
                        {isEditMode ? "Modify entry field parameters below." : "Fill out details below to inject a new Notice."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Eid show"
                                            value={form.title}
                                            onChange={(e) =>{
                                                update("title", e.target.value)
                                           }}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
      <Switch id="isActive" defaultChecked={form.is_active} onCheckedChange={(e) =>{
                                                  setForm((prev) => {
            const updated: any = { ...prev, isActive: e };
            return updated;
        });
                                           }}/>
      <Label htmlFor="isActive">Status {form.is_active? 'Active': 'In active'}</Label>
    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Notice type</Label>
                                        
                                        <Select value={form.type} onValueChange={(v) => update("type", v)}>
                                            <SelectTrigger className="w-full" id="type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                               <SelectItem value={"event"}>Event</SelectItem>
                                                <SelectItem value={"announcement"}>Announcement</SelectItem>
                                                 <SelectItem value={"warning"}>Warning</SelectItem>
                                                  <SelectItem value={"info"}>Info</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Notice Priority</Label>
                                       
                                        <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
                                            <SelectTrigger className="w-full" id="subCategory">
                                                <SelectValue placeholder="Sub Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={"low"}>Low</SelectItem>
                                                <SelectItem value={"medium"}>Medium</SelectItem>
                                                 <SelectItem value={"high"}>High</SelectItem>
                                                
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Today there is eid show..."
                                        className="min-h-25"
                                        value={form.message}
                                        onChange={(e) => update("message", e.target.value)}
                                    />
                                </div>
                            </div>

                 


              


                    {/* Submit Action */}
                    <Button onClick={submit} disabled={loading} className="w-full mt-4">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEditMode ? "Saving Changes..." : "Creating..."}
                            </>
                        ) : isEditMode ? (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Create a notice
                            </>
                        )}
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}