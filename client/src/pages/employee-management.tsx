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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Search, Plus, Download, Upload, Trash2, Settings } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from 'xlsx';
import { z } from "zod";

const bulkUpdateSchema = z.object({
  title: z.string().optional(),
  department: z.string().optional(),
  managerId: z.union([
    z.literal("unchanged"),
    z.literal("none"),
    z.string().regex(/^\d+$/, "Manager ID must be a number")
  ])
});

type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>;

function EmployeeManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterManager, setFilterManager] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");


  // Form for bulk update
  const bulkUpdateForm = useForm<BulkUpdateFormData>({
    defaultValues: {
      title: "",
      department: "",
      managerId: "unchanged", // Set default value to "unchanged"
    },
    resolver: zodResolver(bulkUpdateSchema)
  });

  const form = useForm({
    defaultValues: {
      title: "",
      department: "",
      email: "",
    },
    resolver: zodResolver(
      insertUserSchema.pick({
        title: true,
        department: true,
        email: true,
      })
    ),
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
      email: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(
      insertUserSchema.pick({
        title: true,
        department: true,
        email: true,
      })
    ),
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
    mutationFn: async (data: { userId: number; title: string; department: string; email: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.userId}`, {
        title: data.title,
        department: data.department,
        email: data.email,
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

  // Mutation để import nhân viên hàng loạt
  const importEmployeesMutation = useMutation({
    mutationFn: async (data: { users: any[]; defaultPassword: string }) => {
      const res = await apiRequest("POST", "/api/users/bulk-import", {
        users: data.users,
        defaultPassword: data.defaultPassword,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowImportDialog(false);
      setImportData([]);
      setDefaultPassword("");
      toast({
        title: "Import thành công",
        description: (
          <div className="mt-2 space-y-2">
            <p>✅ Đã thêm {data.total} nhân viên vào hệ thống</p>
            {data.skipped.length > 0 && (
              <>
                <p>⚠️ {data.skipped.length} nhân viên bị bỏ qua do trùng lặp:</p>
                <ul className="list-disc pl-4">
                  {data.skipped.slice(0, 3).map((item: any) => (
                    <li key={item.row}>
                      Dòng {item.row} ({item.username}): {item.reason}
                    </li>
                  ))}
                  {data.skipped.length > 3 && (
                    <li>...và {data.skipped.length - 3} trường hợp khác</li>
                  )}
                </ul>
              </>
            )}
          </div>
        ),
      });
    },
    onError: (error) => {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.details) {
          // Show validation errors
          toast({
            title: "Lỗi import",
            description: (
              <div className="mt-2 space-y-2">
                <p>Có lỗi ở các dòng sau:</p>
                <ul className="list-disc pl-4">
                  {errorData.details.slice(0, 3).map((err: any) => (
                    <li key={err.row}>
                      Dòng {err.row} ({err.username}): {err.errors[0]}
                    </li>
                  ))}
                  {errorData.details.length > 3 && (
                    <li>...và {errorData.details.length - 3} lỗi khác</li>
                  )}
                </ul>
              </div>
            ),
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Lỗi import",
          description: "Có lỗi xảy ra khi import nhân viên",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation for bulk update
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: {
      employeeIds: number[];
      title?: string;
      department?: string;
      managerId?: number | null;
    }) => {
      const res = await apiRequest("PATCH", "/api/users/bulk-update", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update users");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowBulkUpdateDialog(false);
      setSelectedEmployees([]);
      toast({
        title: "Cập nhật thành công",
        description: "Đã cập nhật thông tin cho các nhân viên đã chọn",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update bulk update form submit handler
  const onBulkUpdateSubmit = (data: BulkUpdateFormData) => {
    const updateData: {
      employeeIds: number[];
      title?: string;
      department?: string;
      managerId?: number | null;
    } = {
      employeeIds: selectedEmployees
    };

    if (data.title?.trim()) {
      updateData.title = data.title.trim();
    }

    if (data.department?.trim()) {
      updateData.department = data.department.trim();
    }

    // Handle managerId correctly
    if (data.managerId !== "unchanged") {
      updateData.managerId = data.managerId === "none" ? null : parseInt(data.managerId);
    }

    console.log('Sending bulk update:', updateData); // Debug log

    bulkUpdateMutation.mutate(updateData);
  };

  // Add reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/reset-password`, { newPassword });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã reset mật khẩu cho nhân viên",
      });
      setSelectedUser(null);
      setShowResetPasswordDialog(false);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
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
    editForm.reset({
      title: employee.title || "",
      department: employee.department || "",
      email: employee.email || "",
    });
    setShowEditDialog(true);
  };

  // Handle form submission
  const onSubmit = (data: any) => {
    if (!selectedUser) return;
    updateEmployeeMutation.mutate({
      userId: selectedUser.id,
      title: data.title,
      department: data.department,
      email: data.email,
    });
  };

  // Handle add employee form submission
  const onAddSubmit = (data: any) => {
    addEmployeeMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: any) => {
    if (!selectedUser) return;
    updateEmployeeMutation.mutate({
      userId: selectedUser.id,
      ...data,
    });
    setShowEditDialog(false);
  };

  // Filter employees
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch =
      searchTerm === "" ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      filterRole === "all" || employee.role === filterRole;

    const matchesDepartment =
      filterDepartment === "all" || employee.department === filterDepartment;

    const matchesManager =
      filterManager === "all" || employee.managerId?.toString() === filterManager;

    return matchesSearch && matchesRole && matchesDepartment && matchesManager;
  });

  const totalFilteredItems = filteredEmployees?.length || 0;
  const totalPages = Math.ceil(totalFilteredItems / pageSize);
  const paginatedEmployees = filteredEmployees?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Get unique departments for filter
  const departments = [...new Set(employees?.map(e => e.department).filter(Boolean))];

  const handleDownloadTemplate = () => {
    const template = [
      {
        username: "username",
        email: "email@example.com",
        first_name: "first_name",
        last_name: "last_name",
        department: "department",
        position: "position"
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "employee_import_template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validate required columns
        const requiredColumns = ['username', 'email', 'first_name', 'last_name', 'department', 'position'];
        const firstRow = data[0] as any;
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          toast({
            title: "Lỗi format file",
            description: `File thiếu các cột: ${missingColumns.join(", ")}`,
            variant: "destructive",
          });
          return;
        }

        setImportData(data);
      } catch (error) {
        toast({
          title: "Lỗi đọc file",
          description: "Không thể đọc file Excel. Vui lòng kiểm tra lại format file",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle select all in current page
  const handleSelectAllInPage = (checked: boolean) => {
    if (checked) {
      const pageEmployees = paginatedEmployees?.map(e => e.id) || [];
      setSelectedEmployees(prev =>
        [...new Set([...prev, ...pageEmployees])]
      );
    } else {
      const pageEmployees = new Set(paginatedEmployees?.map(e => e.id));
      setSelectedEmployees(prev =>
        prev.filter(id => !pageEmployees.has(id))
      );
    }
  };



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

        {/* Toolbar with filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, mã số, email, chức danh..."
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
            <Select value={filterManager} onValueChange={setFilterManager}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo quản lý" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả quản lý</SelectItem>
                <SelectItem value="none">Không có quản lý</SelectItem>
                {managers?.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedEmployees.length > 0 && (
            <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Cập nhật {selectedEmployees.length} nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cập nhật thông tin hàng loạt</DialogTitle>
                  <DialogDescription>
                    Cập nhật thông tin cho {selectedEmployees.length} nhân viên đã chọn
                  </DialogDescription>
                </DialogHeader>
                {/* Update the bulk update dialog form section */}
                <form onSubmit={bulkUpdateForm.handleSubmit(onBulkUpdateSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chức danh (để trống nếu không thay đổi)</Label>
                    <Input {...bulkUpdateForm.register("title")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bộ phận (để trống nếu không thay đổi)</Label>
                    <Input {...bulkUpdateForm.register("department")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quản lý trực tiếp</Label>
                    <Select
                      value={bulkUpdateForm.watch("managerId") || "unchanged"}
                      onValueChange={(value) => bulkUpdateForm.setValue("managerId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quản lý" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unchanged">Giữ nguyên quản lý hiện tại</SelectItem>
                        <SelectItem value="none">Xóa quản lý</SelectItem>
                        {managers?.filter(m => !selectedEmployees.includes(m.id)).map((manager) => (
                          <SelectItem key={manager.id} value={manager.id.toString()}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={bulkUpdateMutation.isPending}>
                      {bulkUpdateMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...addForm.register("email")}
                      required
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

          {user?.role === "admin" && (
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Import danh sách nhân viên</DialogTitle>
                  <DialogDescription>
                    Tải lên file Excel chứa danh sách nhân viên cần thêm vào hệ thống
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mật khẩu mặc định</Label>
                    <Input
                      type="text"
                      value={defaultPassword}
                      onChange={(e) => setDefaultPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mặc định cho tất cả nhân viên"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                      <Download className="w-4 h-4 mr-2" />
                      Tải template
                    </Button>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {importData.length > 0 && (
                    <>
                      <div className="rounded-md border">
                        <div className="p-4 bg-muted">
                          <p className="text-sm font-medium">
                            Tổng số nhân viên: {importData.length}
                          </p>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Username</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Họ</TableHead>
                              <TableHead>Tên</TableHead>
                              <TableHead>Phòng ban</TableHead>
                              <TableHead>Chức vụ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importData.slice(0, 5).map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.username}</TableCell>
                                <TableCell>{item.email}</TableCell>
                                <TableCell>{item.first_name}</TableCell>
                                <TableCell>{item.last_name}</TableCell>
                                <TableCell>{item.department}</TableCell>
                                <TableCell>{item.position}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {importData.length > 5 && (
                          <div className="p-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              ... và {importData.length - 5} nhân viên khác
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            if (!defaultPassword.trim()) {
                              toast({
                                title: "Lỗi",
                                description: "Vui lòng nhập mật khẩu mặc định",
                                variant: "destructive",
                              });
                              return;
                            }
                            importEmployeesMutation.mutate({
                              users: importData,
                              defaultPassword: defaultPassword.trim(),
                            });
                          }}
                          disabled={importEmployeesMutation.isPending}
                        >
                          {importEmployeesMutation.isPending
                            ? "Đang import..."
                            : `Import ${importData.length} nhân viên`}
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Employee table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      paginatedEmployees?.length > 0 &&
                      paginatedEmployees?.every(e => selectedEmployees.includes(e.id))
                    }
                    onCheckedChange={handleSelectAllInPage}
                  />
                </TableHead>
                <TableHead>Mã số</TableHead>
                <TableHead>Tên nhân viên</TableHead>
                <TableHead>Email</TableHead>
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
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked) => {
                        setSelectedEmployees(prev =>
                          checked
                            ? [...prev, employee.id]
                            : prev.filter(id => id !== employee.id)
                        );
                      }}
                    />
                  </TableCell>
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
                  <TableCell>{employee.email}</TableCell>
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
                        onValueChange={(value) =>
                          updateManagerMutation.mutate({
                            userId: employee.id,
                            managerId: value === "none" ? null : parseInt(value)
                          })
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue>
                            {employee.managerId
                              ? managers?.find(m => m.id === employee.managerId)?.name
                              : "Không có quản lý"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="none">Không có quản lý</SelectItem>
                        {managers?.filter(m => m.id !== employee.id).map((manager) => (
                          <SelectItem key={manager.id} value={manager.id.toString()}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">
                        {managers?.find(m => m.id === employee.managerId)?.name || "Không có quản lý"}
                      </span>
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
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Hiển thị {paginatedEmployees?.length || 0} / {totalFilteredItems} nhân viên
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              Đầu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span className="text-sm">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Cuối
            </Button>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sửa thông tin nhân viên</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin cho nhân viên {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Chức danh</Label>
                <Input {...editForm.register("title")} />
              </div>
              <div className="space-y-2">
                <Label>Bộ phận</Label>
                <Input {...editForm.register("department")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...editForm.register("email")} type="email" />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowResetPasswordDialog(true)}
                >
                  Reset mật khẩu
                </Button>
                <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                  {updateEmployeeMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset mật khẩu</DialogTitle>
              <DialogDescription>
                Đặt lại mật khẩu cho nhân viên {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mật khẩu mới</Label>
                <Input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowResetPasswordDialog(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedUser) return;
                    resetPasswordMutation.mutate({
                      userId: selectedUser.id,
                      newPassword: newPassword.trim(),
                    });
                    setShowResetPasswordDialog(false);
                    setNewPassword("");
                  }}
                  disabled={resetPasswordMutation.isPending || !newPassword.trim()}
                >
                  {resetPasswordMutation.isPending ? "Đang reset..." : "Reset mật khẩu"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default EmployeeManagementPage;