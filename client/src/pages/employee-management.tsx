import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Redirect } from "wouter";

export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Lấy danh sách nhân viên tùy theo role
  const { data: employees } = useQuery<User[]>({
    queryKey: [user?.role === "admin" ? "/api/users" : `/api/users/manager/${user?.id}`],
  });

  // Lấy danh sách quản lý để chọn
  const { data: managers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (users) => users.filter(u => u.role === "manager" || u.role === "admin"),
    enabled: user?.role === "admin",
  });

  // Mutation để cập nhật manager cho nhân viên
  const updateManagerMutation = useMutation({
    mutationFn: async ({ userId, managerId }: { userId: number; managerId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/manager`, { managerId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Cập nhật thành công",
        description: "Đã cập nhật quản lý cho nhân viên",
      });
    },
  });

  // Mutation để cập nhật role cho nhân viên
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Cập nhật thành công",
        description: "Đã cập nhật chức vụ cho nhân viên",
      });
    },
  });

  // Redirect if not manager/admin
  if (user?.role !== "manager" && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý nhân viên</h1>
          <p className="text-muted-foreground">
            {user?.role === "admin"
              ? "Quản lý tất cả nhân viên trong hệ thống"
              : "Quản lý nhân viên trong nhóm của bạn"}
          </p>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã số</TableHead>
                <TableHead>Tên nhân viên</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Quản lý trực tiếp</TableHead>
                {user?.role === "admin" && <TableHead>Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal"
                      onClick={() => setSelectedUser(employee)}
                    >
                      {employee.name}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {user?.role === "admin" && employee.role !== "admin" ? (
                      <Select
                        value={employee.role}
                        onValueChange={(role) =>
                          updateRoleMutation.mutate({ userId: employee.id, role })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Nhân viên</SelectItem>
                          <SelectItem value="manager">Quản lý</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={employee.role === "manager" ? "default" : "secondary"}>
                        {employee.role === "admin" ? "Admin" :
                          employee.role === "manager" ? "Quản lý" : "Nhân viên"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user?.role === "admin" && employee.role !== "admin" ? (
                      <Select
                        value={employee.managerId?.toString() || "none"}
                        onValueChange={(managerId) =>
                          updateManagerMutation.mutate({
                            userId: employee.id,
                            managerId: managerId === "none" ? null : parseInt(managerId),
                          })
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Chọn quản lý" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không có quản lý</SelectItem>
                          {managers
                            ?.filter((m) => m.id !== employee.id)
                            .map((manager) => (
                              <SelectItem key={manager.id} value={manager.id.toString()}>
                                {manager.username}-{manager.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      employees?.find(e => e.id === employee.managerId)?.name || "N/A"
                    )}
                  </TableCell>
                  {user?.role === "admin" && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(employee)}
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog hiển thị chi tiết nhân viên */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin nhân viên</DialogTitle>
            <DialogDescription>
              Chi tiết thông tin của nhân viên {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Mã số nhân viên</p>
              <p className="text-sm text-muted-foreground">{selectedUser?.username}</p>
            </div>
            <div>
              <p className="font-medium">Họ và tên</p>
              <p className="text-sm text-muted-foreground">{selectedUser?.name}</p>
            </div>
            <div>
              <p className="font-medium">Chức vụ</p>
              <p className="text-sm text-muted-foreground">
                {selectedUser?.role === "admin" ? "Quản trị viên" :
                  selectedUser?.role === "manager" ? "Quản lý" : "Nhân viên"}
              </p>
            </div>
            <div>
              <p className="font-medium">Quản lý trực tiếp</p>
              <p className="text-sm text-muted-foreground">
                {employees?.find(e => e.id === selectedUser?.managerId)?.name || "Không có"}
              </p>
            </div>
            <div>
              <p className="font-medium">Nhân viên quản lý</p>
              <div className="text-sm text-muted-foreground">
                {employees?.filter(e => e.managerId === selectedUser?.id).length
                  ? employees
                    .filter(e => e.managerId === selectedUser?.id)
                    .map(e => e.name)
                    .join(", ")
                  : "Không có"}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}