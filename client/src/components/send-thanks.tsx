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
import { useState } from "react";
import { cn } from "@/lib/utils";

const TEMPLATE_MESSAGES = [
  {
    label: "Hoàn thành dự án",
    message: "Cảm ơn bạn đã tích cực hỗ trợ và đóng góp để team chúng ta hoàn thành dự án đúng tiến độ. Sự chuyên nghiệp và tinh thần trách nhiệm của bạn đã góp phần quan trọng vào thành công của dự án. Rất mong được tiếp tục hợp tác với bạn trong các dự án sắp tới."
  },
  {
    label: "Hỗ trợ kỹ thuật",
    message: "Cảm ơn bạn đã nhiệt tình hỗ trợ tôi giải quyết các vấn đề kỹ thuật phức tạp. Kiến thức chuyên môn và sự kiên nhẫn của bạn đã giúp tôi hiểu rõ hơn về vấn đề và tìm ra giải pháp phù hợp. Bạn thực sự là một đồng nghiệp tuyệt vời."
  },
  {
    label: "Chia sẻ kiến thức",
    message: "Cảm ơn bạn đã dành thời gian chia sẻ những kiến thức và kinh nghiệm quý báu. Những buổi trao đổi với bạn luôn mang lại nhiều giá trị và giúp tôi phát triển kỹ năng chuyên môn. Tôi rất trân trọng sự tận tâm và nhiệt huyết của bạn."
  },
  {
    label: "Đóng góp ý kiến",
    message: "Cảm ơn bạn đã đóng góp những ý kiến xây dựng và góc nhìn mới mẻ cho team. Những phản hồi chi tiết và thẳng thắn của bạn đã giúp cải thiện chất lượng công việc và tạo ra những thay đổi tích cực. Rất vui vì có bạn trong team."
  },
  {
    label: "Hướng dẫn nhân viên mới",
    message: "Cảm ơn bạn đã nhiệt tình hướng dẫn và hỗ trợ các thành viên mới trong team. Sự tận tâm và kiên nhẫn của bạn đã giúp họ nhanh chóng hòa nhập và phát huy được năng lực. Bạn là một tấm gương về tinh thần mentoring."
  },
  {
    label: "Chăm sóc khách hàng",
    message: "Cảm ơn bạn đã luôn tận tâm phục vụ và chăm sóc khách hàng. Thái độ chuyên nghiệp và sự chu đáo của bạn đã góp phần tạo nên hình ảnh tốt đẹp của công ty trong mắt khách hàng. Rất tự hào vì có bạn trong đội ngũ."
  },
  {
    label: "Sáng tạo giải pháp",
    message: "Cảm ơn bạn đã đề xuất những giải pháp sáng tạo và hiệu quả cho các thách thức của dự án. Tư duy đổi mới và khả năng giải quyết vấn đề của bạn đã mang lại nhiều giá trị cho team và công ty. Mong rằng bạn sẽ tiếp tục phát huy."
  },
  {
    label: "Tinh thần đồng đội",
    message: "Cảm ơn bạn đã là một đồng nghiệp tuyệt vời với tinh thần đồng đội cao. Sự nhiệt tình, thân thiện và sẵn sàng hỗ trợ của bạn đã góp phần tạo nên môi trường làm việc tích cực và gắn kết. Rất may mắn vì được làm việc cùng bạn."
  }
];

export function SendThanks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const [open, setOpen] = useState(false);

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

  const filteredUsers = users?.filter((u) => u.id !== user!.id) || [];

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
                            ? filteredUsers.find((user) => user.id === field.value)?.name
                            : "Chọn đồng nghiệp"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm theo tên, mã nhân viên hoặc bộ phận..." />
                        <CommandEmpty>Không tìm thấy nhân viên nào</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {filteredUsers.map((u) => (
                            <CommandItem
                              value={`${u.name} ${u.username} ${u.department || ''}`}
                              key={u.id}
                              onSelect={() => {
                                form.setValue("toId", u.id);
                                setOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === u.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <div>{u.name} ({u.username})</div>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full justify-start"
                        >
                          Chọn lời cảm ơn mẫu
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Tìm kiếm mẫu..." />
                          <CommandEmpty>Không tìm thấy mẫu phù hợp</CommandEmpty>
                          <CommandGroup>
                            {TEMPLATE_MESSAGES.map((template, index) => (
                              <CommandItem
                                key={index}
                                onSelect={() => {
                                  form.setValue("message", template.message);
                                }}
                              >
                                {template.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
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