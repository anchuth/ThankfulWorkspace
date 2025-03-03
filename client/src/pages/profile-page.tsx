import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Thanks } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: stats } = useQuery<{ received: Thanks[]; sent: Thanks[] }>({
    queryKey: [`/api/stats/${user!.id}`],
  });

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await apiRequest("POST", "/api/change-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Đổi mật khẩu thành công",
        description: "Vui lòng sử dụng mật khẩu mới để đăng nhập lần sau",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Đổi mật khẩu thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: any) {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không khớp",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <UserCircle className="h-16 w-16 text-primary" />
          <div>
            <h1 className="text-3xl font-bold mb-2">{user?.name}</h1>
            <p className="text-muted-foreground">
              {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
            </p>
            <p className="text-muted-foreground">
              Mã số nhân viên: {user?.username}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
            <CardDescription>
              Để bảo mật tài khoản, bạn nên thường xuyên thay đổi mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...form.register("currentPassword")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...form.register("newPassword")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register("confirmPassword")}
                  required
                />
              </div>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Đang xử lý..." : "Đổi mật khẩu"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Lời cảm ơn đã nhận</h2>
            <div className="space-y-4">
              {stats?.received.map((thanks) => (
                <ThanksCard key={thanks.id} thanks={thanks} />
              ))}
              {(!stats?.received || stats.received.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Chưa có lời cảm ơn nào
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Lời cảm ơn đã gửi</h2>
            <div className="space-y-4">
              {stats?.sent.map((thanks) => (
                <ThanksCard key={thanks.id} thanks={thanks} />
              ))}
              {(!stats?.sent || stats.sent.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Chưa gửi lời cảm ơn nào
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

function ThanksCard({ thanks }: { thanks: Thanks }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {formatDistance(new Date(thanks.createdAt), new Date(), {
            addSuffix: true,
          })}
        </CardTitle>
        <Badge variant={thanks.status === "approved" ? "default" : "secondary"}>
          {thanks.status === "pending" ? "Chờ duyệt" : 
           thanks.status === "approved" ? "Đã duyệt" :
           "Từ chối"}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{thanks.message}</p>
        {thanks.status === "rejected" && thanks.rejectReason && (
          <p className="text-sm text-destructive mt-2">
            Lý do từ chối: {thanks.rejectReason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}