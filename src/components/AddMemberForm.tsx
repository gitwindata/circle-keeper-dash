import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";
import { addMemberVisit } from "@/lib/member-storage"; // Import the storage utility

const serviceTypes = ["Potong", "Ritual", "Coloring", "Styling", "Treatment"];

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Nama Lengkap harus memiliki setidaknya 2 karakter.",
  }),
  whatsappNumber: z.string().regex(/^\d+$/, {
    message: "Nomor WhatsApp harus berupa angka.",
  }).min(10, {
    message: "Nomor WhatsApp harus memiliki setidaknya 10 digit.",
  }),
  instagramHandle: z.string().optional(),
  visitDate: z.date({
    required_error: "Tanggal kunjungan diperlukan.",
  }),
  serviceType: z.string({
    required_error: "Jenis layanan diperlukan.",
  }),
  hairstylistComment: z.string().optional(),
});

interface AddMemberFormProps {
  onMemberAdded: () => void;
  onClose: () => void;
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ onMemberAdded, onClose }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      whatsappNumber: "",
      instagramHandle: "",
      visitDate: new Date(),
      serviceType: "",
      hairstylistComment: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const hairstylistId = localStorage.getItem('hms_hairstylist_id');
    if (!hairstylistId) {
      alert('Hairstylist ID not found. Please log in again.');
      return;
    }

    addMemberVisit({
      fullName: values.fullName,
      whatsappNumber: values.whatsappNumber,
      instagramHandle: values.instagramHandle,
      visitDate: values.visitDate,
      serviceType: values.serviceType,
      hairstylistComment: values.hairstylistComment,
      hairstylistId: hairstylistId, // Pass the hairstylist ID
    });
    onMemberAdded();
    onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama Lengkap Member" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="whatsappNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor WhatsApp</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Contoh: 6281234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instagramHandle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram Handle (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: @nama_member" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="visitDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Kunjungan</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Layanan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis layanan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hairstylistComment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Komentar Hairstylist (Opsional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Tambahkan komentar tentang kunjungan member" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Tambah Member</Button>
      </form>
    </Form>
  );
};

export default AddMemberForm;
