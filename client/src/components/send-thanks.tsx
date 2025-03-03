import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertThanksSchema, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Helper function to normalize Vietnamese text for search
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function SendThanks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm({
    resolver: zodResolver(insertThanksSchema),
    defaultValues: {
      toId: undefined,
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { toId: number; message: string }) => {
      const res = await apiRequest("POST", "/api/thanks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stats/${user!.id}`] });
      form.reset();
      toast({
        title: "Gửi lời cảm ơn thành công!",
        description: "Lời cảm ơn của bạn sẽ được quản lý xem xét.",
      });
    },
  });

  // Filter users based on search term
  const filteredUsers = users?.filter((u) => {
    if (!searchTerm.trim()) return true;

    const searchValue = normalizeString(searchTerm);
    const userName = normalizeString(u.name);
    const userUsername = normalizeString(u.username);
    const userDepartment = u.department ? normalizeString(u.department) : '';

    return userName.includes(searchValue) || 
           userUsername.includes(searchValue) || 
           userDepartment.includes(searchValue);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gửi lời cảm ơn</CardTitle>
        <CardDescription>
          Ghi nhận sự đóng góp của đồng nghiệp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="toId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Người nhận</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? users?.find((user) => user.id === field.value)?.name
                            : "Chọn đồng nghiệp"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Tìm kiếm theo tên, mã nhân viên hoặc bộ phận..."
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                        />
                        <CommandEmpty>Không tìm thấy nhân viên</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {filteredUsers
                            ?.filter((u) => u.id !== user!.id)
                            .map((u) => (
                              <CommandItem
                                key={u.id}
                                value={u.id.toString()}
                                onSelect={() => {
                                  form.setValue("toId", u.id);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === u.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <div className="font-medium">
                                    {u.name} ({u.username})
                                  </div>
                                  {u.department && (
                                    <div className="text-xs text-muted-foreground">
                                      {u.department}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lời nhắn</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Textarea
                        placeholder="Viết lời cảm ơn của bạn..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang gửi..." : "Gửi lời cảm ơn"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}