import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  LayoutDashboard,
  FileText,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  Users
} from "lucide-react";
import { getCases, getAdminStats, adminLogout, getCurrentAdmin } from "@/lib/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin");
        return;
      }

      try {
        await getCurrentAdmin();
        const storedInfo = localStorage.getItem("adminInfo");
        if (storedInfo) {
          setAdminInfo(JSON.parse(storedInfo));
        }
      } catch {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        navigate("/admin");
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [casesData, statsData] = await Promise.all([
          getCases({
            page,
            page_size: 10,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            search: searchQuery || undefined,
          }),
          getAdminStats(),
        ]);
        
        setCases(casesData.cases);
        setTotalPages(Math.ceil(casesData.total / 10));
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load data:", error);
        if (error.response?.status === 401) {
          navigate("/admin");
        } else {
          toast.error("Failed to load cases");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [page, statusFilter, priorityFilter, searchQuery, navigate]);

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      // Continue with logout even if API fails
    }
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin");
    toast.success("Logged out successfully");
  };

  const getStatusBadge = (status) => {
    const styles = {
      "New": "bg-blue-100 text-blue-800",
      "Under Review": "bg-purple-100 text-purple-800",
      "In Progress": "bg-amber-100 text-amber-800",
      "Escalated": "bg-red-100 text-red-800",
      "Resolved": "bg-green-100 text-green-800",
      "Closed": "bg-slate-100 text-slate-800",
    };
    return <Badge className={styles[status] || "bg-slate-100 text-slate-800"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      "P1": "bg-red-600 text-white",
      "P2": "bg-amber-500 text-white",
      "P3": "bg-slate-400 text-white",
    };
    return <Badge className={styles[priority] || "bg-slate-400 text-white"}>{priority}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b-4 border-wbuk-red">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col leading-none">
              <span className="font-heading font-extrabold text-lg text-wbuk-red">WB</span>
              <span className="font-heading font-extrabold text-lg text-wbuk-red">UK</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-gray-900">Advisor Portal</h1>
              <p className="text-xs text-gray-500">Case Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {adminInfo?.role === "super_admin" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/admin/users")}
                className="rounded-none border-wbuk-red text-wbuk-red hover:bg-red-50"
                data-testid="manage-users-button"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
            )}
            <span className="text-sm text-gray-600 hidden sm:inline">
              {adminInfo?.name || "Admin"}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-600 hover:text-wbuk-red hover:bg-red-50"
              data-testid="admin-logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-wbuk-red">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Cases</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.total_cases || 0}</p>
                </div>
                <LayoutDashboard className="h-8 w-8 text-gray-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">New Cases</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.new_cases || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600">{stats?.in_progress || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">High Priority</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.high_priority || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-none">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by reference or summary..."
                  className="pl-10 rounded-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-cases-input"
                />
              </div>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full md:w-[180px] rounded-none" data-testid="status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter || "all"} onValueChange={(v) => setPriorityFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full md:w-[150px] rounded-none" data-testid="priority-filter">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="P1">P1 - Critical</SelectItem>
                  <SelectItem value="P2">P2 - High</SelectItem>
                  <SelectItem value="P3">P3 - Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases Table */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="font-heading text-wbuk-red">Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-wbuk-red" />
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No cases found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((caseItem) => (
                      <TableRow 
                        key={caseItem.case_reference}
                        className="cursor-pointer hover:bg-red-50"
                        onClick={() => navigate(`/admin/cases/${caseItem.case_reference}`)}
                        data-testid={`case-row-${caseItem.case_reference}`}
                      >
                        <TableCell className="font-mono font-medium">
                          {caseItem.case_reference}
                        </TableCell>
                        <TableCell>
                          {caseItem.classification?.organisation_sector || "—"}
                        </TableCell>
                        <TableCell>
                          {caseItem.classification?.wrongdoing_type || "—"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(caseItem.case_status)}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(caseItem.priority)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(caseItem.submitted_at)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-wbuk-red hover:bg-red-50">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-none"
                      data-testid="prev-page-button"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-none"
                      data-testid="next-page-button"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
