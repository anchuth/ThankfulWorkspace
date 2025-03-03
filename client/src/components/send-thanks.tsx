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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertThanksSchema, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { useState } from "react";

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
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.username.toLowerCase().includes(searchLower) ||
      (u.department && u.department.toLowerCase().includes(searchLower))
    );
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
            <div className="space-y-4">
              <Input
                placeholder="Tìm kiếm theo tên, mã nhân viên hoặc bộ phận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />

              <FormField
                control={form.control}
                name="toId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người nhận</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(parseInt(val))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đồng nghiệp" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredUsers
                          ?.filter((u) => u.id !== user!.id)
                          .map((u) => (
                            <SelectItem
                              key={u.id}
                              value={u.id.toString()}
                              className="flex flex-col items-start py-2"
                            >
                              <div className="font-medium">
                                {u.name} ({u.username})
                              </div>
                              {u.department && (
                                <div className="text-xs text-muted-foreground">
                                  {u.department}
                                </div>
                              )}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lời nhắn</FormLabel>
                  <div className="space-y-2">
                    <Select
                      onValueChange={(message) => form.setValue("message", message)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lời cảm ơn mẫu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPLATE_MESSAGES.map((template, index) => (
                          <SelectItem key={index} value={template.message}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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