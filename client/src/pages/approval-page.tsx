import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Redirect } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type ThanksStatus = "pending" | "approved" | "rejected" | "all";

export default function ApprovalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<ThanksStatus>("all");
  const [selectedThanks, setSelectedThanks] = useState<Thanks | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Redirect if not manager/admin
  if (user?.role !== "manager" && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: thanks, isLoading } = useQuery<Thanks[]>({
    queryKey: ["/api/approvals"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      thanksId,
      action,
      reason,
    }: {
      thanksId: number;
      action: "approve" | "reject";
      reason?: string;
    }) => {
      const res = await apiRequest("POST", `/api/thanks/${thanksId}/${action}`, { reason });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Thành công",
        description: "Lời cảm ơn đã được xử lý",
      });
      setRejectDialogOpen(false);
      setSelectedThanks(null);
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReject = (thanks: Thanks) => {
    setSelectedThanks(thanks);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!selectedThanks || !rejectReason.trim()) return;
    updateMutation.mutate({
      thanksId: selectedThanks.id,
      action: "reject",
      reason: rejectReason,
    });
  };

  // Filter thanks based on status
  const filteredThanks = thanks?.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  // Get pending thanks
  const pendingThanks = thanks?.filter(t => t.status === "pending");

  // Get history thanks (approved/rejected)
  const historyThanks = thanks?.filter(t => 
    (t.status === "approved" || t.status === "rejected") && 
    t.approvedById === user?.id
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Duyệt lời cảm ơn</h1>
          <p className="text-muted-foreground">
            Xem xét và phê duyệt các lời cảm ơn từ nhân viên
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="history">Lịch sử duyệt</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
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
              {pendingThanks?.map((thanks) => {
                const fromUser = users?.find((u) => u.id === thanks.fromId);
                const toUser = users?.find((u) => u.id === thanks.toId);

                return (
                  <Card key={thanks.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {fromUser?.name} → {toUser?.name}
                          </CardTitle>
                          <CardDescription>
                            {formatDistance(new Date(thanks.createdAt), new Date(), {
                              addSuffix: true,
                            })}
                          </CardDescription>
                        </div>
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
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{thanks.message}</p>
                      {thanks.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
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
                            onClick={() => handleReject(thanks)}
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
              {(!pendingThanks || pendingThanks.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Không có lời cảm ơn nào chờ duyệt
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              {historyThanks?.map((thanks) => {
                const fromUser = users?.find((u) => u.id === thanks.fromId);
                const toUser = users?.find((u) => u.id === thanks.toId);

                return (
                  <Card key={thanks.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {fromUser?.name} → {toUser?.name}
                          </CardTitle>
                          <CardDescription>
                            Đã xử lý: {formatDistance(new Date(thanks.approvedAt!), new Date(), {
                              addSuffix: true,
                            })}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={thanks.status === "approved" ? "default" : "destructive"}
                        >
                          {thanks.status === "approved" ? "Đã duyệt" : "Từ chối"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{thanks.message}</p>
                      {thanks.status === "rejected" && thanks.rejectReason && (
                        <p className="text-sm text-destructive">
                          Lý do từ chối: {thanks.rejectReason}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {(!historyThanks || historyThanks.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Chưa có lời cảm ơn nào được xử lý
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Từ chối lời cảm ơn</DialogTitle>
              <DialogDescription>
                Vui lòng nhập lý do từ chối để người gửi hiểu được vấn đề
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                disabled={updateMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || updateMutation.isPending}
              >
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}