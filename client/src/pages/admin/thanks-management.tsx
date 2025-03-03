import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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
import { formatDistance } from "date-fns";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  // Filter and paginate thanks
  const filteredThanks = allThanks?.filter(thanks => {
    const fromUser = users?.find(u => u.id === thanks.fromId);
    const toUser = users?.find(u => u.id === thanks.toId);
    
    const matchesSearch = 
      searchTerm === "" ||
      fromUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thanks.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === "all" || thanks.status === filterStatus;

    return matchesSearch && matchesStatus;
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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người gửi</TableHead>
                <TableHead>Người nhận</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người duyệt</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedThanks?.map((thanks) => {
                const fromUser = users?.find(u => u.id === thanks.fromId);
                const toUser = users?.find(u => u.id === thanks.toId);
                const approvedBy = users?.find(u => u.id === thanks.approvedById);

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
                      {thanks.status === "rejected" && thanks.rejectReason && (
                        <p className="text-sm text-destructive mt-1">
                          Lý do: {thanks.rejectReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {approvedBy?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {formatDistance(new Date(thanks.createdAt), new Date(), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
