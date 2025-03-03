import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Thanks, User } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Redirect } from "wouter";

type ThanksStatus = "pending" | "approved" | "rejected" | "all";

export default function ApprovalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<ThanksStatus>("all");

  // Redirect if not manager/admin
  if (user?.role !== "manager" && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: thanks } = useQuery<Thanks[]>({
    queryKey: ["/api/approvals"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      thanksId,
      action,
    }: {
      thanksId: number;
      action: "approve" | "reject";
    }) => {
      const res = await apiRequest("POST", `/api/thanks/${thanksId}/${action}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Cập nhật thành công",
        description: "Lời cảm ơn đã được xử lý",
      });
    },
  });

  const filteredThanks = thanks?.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Duyệt lời cảm ơn</h1>
          <p className="text-muted-foreground">
            Xem xét và phê duyệt các lời cảm ơn từ nhân viên
          </p>
        </div>

        <div className="flex justify-between items-center">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as ThanksStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredThanks?.map((thanks) => {
            const fromUser = users?.find((u) => u.id === thanks.fromId);
            const toUser = users?.find((u) => u.id === thanks.toId);

            return (
              <Card key={thanks.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {fromUser?.name} → {toUser?.name}
                    </CardTitle>
                    <Badge
                      variant={
                        thanks.status === "approved"
                          ? "default"
                          : thanks.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {thanks.status === "pending"
                        ? "Chờ duyệt"
                        : thanks.status === "approved"
                        ? "Đã duyệt"
                        : "Từ chối"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatDistance(new Date(thanks.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{thanks.message}</p>
                  {thanks.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({
                            thanksId: thanks.id,
                            action: "approve",
                          })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Phê duyệt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({
                            thanksId: thanks.id,
                            action: "reject",
                          })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {(!filteredThanks || filteredThanks.length === 0) && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Không có lời cảm ơn nào {filter !== "all" ? "ở trạng thái này" : ""}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
