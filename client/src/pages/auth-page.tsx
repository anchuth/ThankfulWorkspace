import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { Redirect } from "wouter";
import { Award } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();

  if (user) {
    return <Redirect to="/" />;
  }

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Đăng nhập</CardTitle>
            <CardDescription>Đăng nhập để sử dụng đầy đủ tính năng</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="username">Mã số nhân viên</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  required
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  required
                  disabled={loginMutation.isPending}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center text-primary-foreground p-8">
        <div className="max-w-md space-y-6">
          <Award className="h-16 w-16" />
          <h1 className="text-4xl font-bold">Company Recognition Portal</h1>
          <p className="text-lg opacity-90">
            Celebrate your colleagues' achievements and build a culture of
            appreciation. Send thanks, receive recognition, and climb the rankings!
          </p>
        </div>
      </div>
    </div>
  );
}