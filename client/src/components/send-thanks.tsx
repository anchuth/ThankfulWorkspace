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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertThanksSchema, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TEMPLATE_MESSAGES = [
  "Cảm ơn bạn đã hỗ trợ tôi hoàn thành dự án đúng hạn",
  "Cảm ơn bạn đã giúp đỡ tôi giải quyết vấn đề kỹ thuật",
  "Cảm ơn bạn đã chia sẻ kiến thức và kinh nghiệm quý báu",
  "Cảm ơn bạn đã đóng góp ý kiến xây dựng cho team",
  "Cảm ơn bạn đã nhiệt tình hướng dẫn thành viên mới",
  "Cảm ơn bạn đã tận tâm phục vụ khách hàng",
  "Cảm ơn bạn đã đề xuất giải pháp sáng tạo",
  "Cảm ơn bạn đã là một teammate tuyệt vời"
];

export function SendThanks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

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
                      {users
                        ?.filter((u) => u.id !== user!.id)
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.username}-{u.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Lời cảm ơn mẫu</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_MESSAGES.map((message, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    className="h-auto py-2 px-3 whitespace-normal text-left justify-start"
                    onClick={() => form.setValue("message", message)}
                  >
                    {message}
                  </Button>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lời nhắn</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Viết lời cảm ơn của bạn..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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