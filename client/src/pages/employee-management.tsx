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

export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Lấy danh sách nhân viên tùy theo role
  const { data: employees } = useQuery<User[]>({
    queryKey: [user?.role === "admin" ? "/api/users" : `/api/users/manager/${user?.id}`],
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
                <TableHead>Quản lý</TableHead>
                {user?.role === "admin" && <TableHead>Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>
                    <Badge variant={employee.role === "manager" ? "default" : "secondary"}>
                      {employee.role === "admin" ? "Admin" : 
                       employee.role === "manager" ? "Quản lý" : "Nhân viên"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {employee.managerId 
                      ? employees.find(e => e.id === employee.managerId)?.name || "N/A"
                      : "N/A"}
                  </TableCell>
                  {user?.role === "admin" && (
                    <TableCell>
                      {employee.role !== "admin" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateManagerMutation.mutate({
                            userId: employee.id,
                            managerId: employee.managerId ? null : user.id
                          })}
                          disabled={updateManagerMutation.isPending}
                        >
                          {employee.managerId ? "Xóa quản lý" : "Thêm làm nhân viên"}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
