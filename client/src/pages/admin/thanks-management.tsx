import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Thanks, User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Redirect } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 10;

export default function ThanksManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedThanks, setSelectedThanks] = useState<Thanks | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Redirect if not admin
  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: allThanks } = useQuery<Thanks[]>({
    queryKey: ["/api/admin/thanks"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Mutation để cập nhật lời cảm ơn
  const updateThanksMutation = useMutation({
    mutationFn: async (data: { 
      id: number; 
      message: string;
      fromId: number;
      toId: number;
      status: "pending" | "approved" | "rejected";
      approvedById?: number;
      rejectReason?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/thanks/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/thanks"] });
      setSelectedThanks(null);
      toast({
        title: "Cập nhật thành công",
        description: "Đã cập nhật lời cảm ơn",
      });
    },
  });

  // Mutation để xóa lời cảm ơn
  const deleteThanksMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/thanks/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/thanks"] });
      toast({
        title: "Xóa thành công",
        description: "Đã xóa lời cảm ơn",
      });
    },
  });

  // Filter thanks based on search term
  const filteredThanks = allThanks?.filter((thanks) => {
    const fromUser = users?.find((u) => u.id === thanks.fromId);
    const toUser = users?.find((u) => u.id === thanks.toId);

    return (
      searchTerm === "" ||
      fromUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thanks.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil((filteredThanks?.length || 0) / ITEMS_PER_PAGE);
  const paginatedThanks = filteredThanks?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý lời cảm ơn</h1>
          <p className="text-muted-foreground">
            Xem và quản lý tất cả lời cảm ơn trong hệ thống
          </p>
        </div>

        {/* Thanh công cụ */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người gửi</TableHead>
                <TableHead>Người nhận</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedThanks?.map((thanks) => {
                const fromUser = users?.find((u) => u.id === thanks.fromId);
                const toUser = users?.find((u) => u.id === thanks.toId);

                return (
                  <TableRow key={thanks.id}>
                    <TableCell>
                      {fromUser?.name || "N/A"}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {fromUser?.username}
                      </span>
                    </TableCell>
                    <TableCell>
                      {toUser?.name || "N/A"}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {toUser?.username}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="line-clamp-2">{thanks.message}</div>
                    </TableCell>
                    <TableCell>{thanks.points}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      {formatDistance(new Date(thanks.createdAt), new Date(), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedThanks(thanks)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Bạn có chắc chắn muốn xóa lời cảm ơn này?")) {
                              deleteThanksMutation.mutate(thanks.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Dialog chỉnh sửa lời cảm ơn */}
        <Dialog open={!!selectedThanks} onOpenChange={(open) => !open && setSelectedThanks(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa lời cảm ơn</DialogTitle>
              <DialogDescription>
                Chỉnh sửa thông tin lời cảm ơn
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Người gửi</Label>
                <Select
                  value={selectedThanks?.fromId?.toString()}
                  onValueChange={(value) =>
                    setSelectedThanks((prev) =>
                      prev ? { ...prev, fromId: parseInt(value) } : null
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn người gửi" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Người nhận</Label>
                <Select
                  value={selectedThanks?.toId?.toString()}
                  onValueChange={(value) =>
                    setSelectedThanks((prev) =>
                      prev ? { ...prev, toId: parseInt(value) } : null
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn người nhận" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Input
                  value={selectedThanks?.message || ""}
                  onChange={(e) =>
                    setSelectedThanks((prev) =>
                      prev ? { ...prev, message: e.target.value } : null
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={selectedThanks?.status}
                  onValueChange={(value: "pending" | "approved" | "rejected") =>
                    setSelectedThanks((prev) =>
                      prev ? { 
                        ...prev, 
                        status: value,
                        approvedById: value === "approved" ? user?.id : undefined,
                        rejectReason: value === "rejected" ? prev.rejectReason : undefined
                      } : null
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedThanks?.status === "rejected" && (
                <div className="space-y-2">
                  <Label>Lý do từ chối</Label>
                  <Input
                    value={selectedThanks?.rejectReason || ""}
                    onChange={(e) =>
                      setSelectedThanks((prev) =>
                        prev ? { ...prev, rejectReason: e.target.value } : null
                      )
                    }
                    placeholder="Nhập lý do từ chối"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (!selectedThanks) return;
                  updateThanksMutation.mutate({
                    id: selectedThanks.id,
                    message: selectedThanks.message,
                    fromId: selectedThanks.fromId,
                    toId: selectedThanks.toId,
                    status: selectedThanks.status,
                    ...(selectedThanks.status === "approved" && { approvedById: user?.id }),
                    ...(selectedThanks.status === "rejected" && { rejectReason: selectedThanks.rejectReason }),
                  });
                }}
                disabled={updateThanksMutation.isPending}
              >
                {updateThanksMutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trang trước
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Trang sau
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}