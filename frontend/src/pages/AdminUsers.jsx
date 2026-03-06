import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ShieldCheck, 
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Edit,
  Key,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "advisor" });
  const [editData, setEditData] = useState({ name: "", role: "", is_active: true });
  const [newPassword, setNewPassword] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin");
        return;
      }

      try {
        const storedInfo = localStorage.getItem("adminInfo");
        if (storedInfo) {
          const info = JSON.parse(storedInfo);
          setAdminInfo(info);
          
          if (info.role !== "super_admin") {
            toast.error("Access denied. Super admin only.");
            navigate("/admin/dashboard");
            return;
          }
        }

        const response = await fetch(`${API_URL}/api/admin/users`, {
          headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            toast.error("Access denied");
            navigate("/admin/dashboard");
            return;
          }
          throw new Error("Failed to load users");
        }
        
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [navigate]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newUser.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create user");
      }

      const data = await response.json();
      toast.success(`User ${data.email} created successfully`);
      setShowCreateDialog(false);
      setNewUser({ email: "", name: "", password: "", role: "advisor" });
      
      // Reload users
      const usersResponse = await fetch(`${API_URL}/api/admin/users`, { headers: getAuthHeaders() });
      const usersData = await usersResponse.json();
      setUsers(usersData.users);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser.user_id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update user");
      }

      toast.success("User updated successfully");
      setShowEditDialog(false);
      
      // Reload users
      const usersResponse = await fetch(`${API_URL}/api/admin/users`, { headers: getAuthHeaders() });
      const usersData = await usersResponse.json();
      setUsers(usersData.users);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser.user_id}/password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setNewPassword("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setUsers(users.filter(u => u.user_id !== userId));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      super_admin: "bg-purple-100 text-purple-800",
      advisor: "bg-teal-100 text-teal-800",
      viewer: "bg-slate-100 text-slate-800",
    };
    const labels = {
      super_admin: "Super Admin",
      advisor: "Advisor",
      viewer: "Viewer",
    };
    return <Badge className={styles[role] || "bg-slate-100"}>{labels[role] || role}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wbuk-red" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b-4 border-wbuk-red">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/admin/dashboard")}
              className="hover:bg-red-50"
              data-testid="back-to-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex flex-col leading-none">
                <span className="font-heading font-extrabold text-lg text-wbuk-red">WB</span>
                <span className="font-heading font-extrabold text-lg text-wbuk-red">UK</span>
              </div>
              <div>
                <h1 className="font-heading font-bold text-gray-900">User Management</h1>
                <p className="text-xs text-gray-500">Manage advisor accounts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading flex items-center gap-2 text-wbuk-red">
                <Users className="h-5 w-5" />
                Advisor Accounts
              </CardTitle>
              <CardDescription>
                Create and manage accounts for WBUK advisors
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-wbuk-red hover:bg-red-700 rounded-none" data-testid="create-user-button">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new advisor or admin account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="advisor@wbuk.org"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      data-testid="new-user-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="John Smith"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      data-testid="new-user-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      data-testid="new-user-password"
                    />
                    <p className="text-xs text-slate-500">User will be prompted to change on first login</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                      <SelectTrigger data-testid="new-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advisor">Advisor - Can view and manage cases</SelectItem>
                        <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                        <SelectItem value="super_admin">Super Admin - Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-none">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateUser} 
                    disabled={isSubmitting}
                    className="bg-wbuk-red hover:bg-red-700 rounded-none"
                    data-testid="submit-create-user"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id} data-testid={`user-row-${user.user_id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email_hash?.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Disabled</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(user.last_login)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditData({ name: user.name, role: user.role, is_active: user.is_active });
                              setShowEditDialog(true);
                            }}
                            data-testid={`edit-user-${user.user_id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewPassword("");
                              setShowPasswordDialog(true);
                            }}
                            data-testid={`password-user-${user.user_id}`}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          {adminInfo?.user_id !== user.user_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(user.user_id, user.name)}
                              data-testid={`delete-user-${user.user_id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editData.role} onValueChange={(v) => setEditData({ ...editData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advisor">Advisor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editData.is_active ? "active" : "disabled"} 
                  onValueChange={(v) => setEditData({ ...editData, is_active: v === "active" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-none">
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={isSubmitting} className="bg-wbuk-red hover:bg-red-700 rounded-none">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="rounded-none">
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isSubmitting} className="bg-wbuk-red hover:bg-red-700 rounded-none">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
