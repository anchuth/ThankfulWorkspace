import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User, insertUserSchema } from "@shared/schema";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Redirect } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Search, Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

const ITEMS_PER_PAGE = 10;

export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      department: "",
    },
  });

  const addForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      title: "",
      department: "",
      role: "employee",
    },
  });

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

  // Mutation để cập nhật thông tin nhân viên
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: { userId: number; title: string; department: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.userId}`, {
        title: data.title,
        department: data.department,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Cập nhật thành công",
        description: "Đã cập nhật thông tin nhân viên",
      });
    },
  });

  // Mutation để thêm nhân viên mới
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowAddDialog(false);
      addForm.reset();
      toast({
        title: "Thêm nhân viên thành công",
        description: "Đã thêm nhân viên mới vào hệ thống",
      });
    },
  });

  // Mutation để xóa nhân viên
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Xóa nhân viên thành công",
        description: "Đã xóa nhân viên khỏi hệ thống",
      });
    },
  });

  // Redirect if not manager/admin
  if (user?.role !== "manager" && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  // Set form values when selecting a user
  const handleSelectUser = (employee: User) => {
    setSelectedUser(employee);
    form.reset({
      title: employee.title || "",
      department: employee.department || "",
    });
  };

  // Handle form submission
  const onSubmit = (data: any) => {
    if (!selectedUser) return;
    updateEmployeeMutation.mutate({
      userId: selectedUser.id,
      title: data.title,
      department: data.department,
    });
  };

  // Handle add employee form submission
  const onAddSubmit = (data: any) => {
    addEmployeeMutation.mutate(data);
  };

  // Filter and paginate employees
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = 
      searchTerm === "" ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = 
      filterRole === "all" || employee.role === filterRole;

    const matchesDepartment = 
      filterDepartment === "all" || employee.department === filterDepartment;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  const totalPages = Math.ceil((filteredEmployees?.length || 0) / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Get unique departments for filter
  const departments = [...new Set(employees?.map(e => e.department).filter(Boolean))];

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

        {/* Thanh công cụ */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo chức vụ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chức vụ</SelectItem>
              <SelectItem value="employee">Nhân viên</SelectItem>
              <SelectItem value="manager">Quản lý</SelectItem>
              {user?.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
            </SelectContent>
          </Select>

          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo bộ phận" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả bộ phận</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user?.role === "admin" && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm nhân viên mới</DialogTitle>
                  <DialogDescription>
                    Điền thông tin để tạo tài khoản cho nhân viên mới
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Mã số nhân viên</Label>
                    <Input
                      id="username"
                      {...addForm.register("username")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Input
                      id="password"
                      type="password"
                      {...addForm.register("password")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input
                      id="name"
                      {...addForm.register("name")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Chức danh</Label>
                    <Input
                      id="title"
                      {...addForm.register("title")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Bộ phận</Label>
                    <Input
                      id="department"
                      {...addForm.register("department")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Chức vụ</Label>
                    <Select
                      value={addForm.watch("role")}
                      onValueChange={(value) => addForm.setValue("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Nhân viên</SelectItem>
                        <SelectItem value="manager">Quản lý</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={addEmployeeMutation.isPending}>
                      {addEmployeeMutation.isPending ? "Đang thêm..." : "Thêm nhân viên"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã số</TableHead>
                <TableHead>Tên nhân viên</TableHead>
                <TableHead>Chức danh</TableHead>
                <TableHead>Bộ phận</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Quản lý trực tiếp</TableHead>
                {user?.role === "admin" && <TableHead>Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal"
                      onClick={() => handleSelectUser(employee)}
                    >
                      {employee.name}
                    </Button>
                  </TableCell>
                  <TableCell>{employee.title || "Chưa cập nhật"}</TableCell>
                  <TableCell>{employee.department || "Chưa cập nhật"}</TableCell>
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectUser(employee)}
                        >
                          Chi tiết
                        </Button>
                        {employee.role !== "admin" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
                                deleteEmployeeMutation.mutate(employee.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
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

        {/* Dialog hiển thị chi tiết nhân viên */}
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thông tin nhân viên</DialogTitle>
              <DialogDescription>
                Chi tiết thông tin của nhân viên {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <p className="font-medium">Mã số nhân viên</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.username}</p>
              </div>
              <div>
                <p className="font-medium">Họ và tên</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.name}</p>
              </div>
              {user?.role === "admin" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Chức danh</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="Nhập chức danh"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Bộ phận</Label>
                    <Input
                      id="department"
                      {...form.register("department")}
                      placeholder="Nhập bộ phận"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium">Chức danh</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser?.title || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Bộ phận</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser?.department || "Chưa cập nhật"}
                    </p>
                  </div>
                </>
              )}
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
              {user?.role === "admin" && (
                <DialogFooter>
                  <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                    {updateEmployeeMutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
                  </Button>
                </DialogFooter>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}