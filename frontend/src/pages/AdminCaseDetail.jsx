import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShieldCheck, 
  ArrowLeft,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Send,
  Loader2,
  Scale
} from "lucide-react";
import { getCaseDetail, updateCaseStatus, addCaseNote, getCurrentAdmin } from "@/lib/api";
import { toast } from "sonner";

export default function AdminCaseDetail() {
  const navigate = useNavigate();
  const { caseReference } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin");
        return;
      }

      try {
        await getCurrentAdmin();
        const data = await getCaseDetail(caseReference);
        setCaseData(data.case);
        setMessages(data.messages);
      } catch (error) {
        console.error("Failed to load case:", error);
        if (error.response?.status === 401) {
          navigate("/admin");
        } else if (error.response?.status === 404) {
          toast.error("Case not found");
          navigate("/admin/dashboard");
        } else {
          toast.error("Failed to load case details");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [caseReference, navigate]);

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateCaseStatus(caseReference, newStatus);
      setCaseData((prev) => ({ ...prev, case_status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const result = await addCaseNote(caseReference, newNote.trim());
      setCaseData((prev) => ({
        ...prev,
        notes: [
          {
            note_id: result.note_id,
            content: newNote.trim(),
            created_at: new Date().toISOString(),
            created_by_name: "You",
            is_internal: true,
          },
          ...(prev.notes || []),
        ],
      }));
      setNewNote("");
      toast.success("Note added");
    } catch (error) {
      console.error("Failed to add note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
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

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-green-600";
      default:
        return "text-slate-600";
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!caseData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/admin/dashboard")}
              data-testid="back-to-dashboard-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-teal-700" />
              <div>
                <h1 className="font-mono font-bold text-slate-900">{caseReference}</h1>
                <p className="text-xs text-slate-500">Case Detail</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getPriorityBadge(caseData.priority)}
            {getStatusBadge(caseData.case_status)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Case Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">
                  {caseData.ai_summary?.executive_summary || "No summary available"}
                </p>
              </CardContent>
            </Card>

            {/* Classification */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Organisation Sector</p>
                    <p className="font-medium">
                      {caseData.classification?.organisation_sector || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Type of Wrongdoing</p>
                    <p className="font-medium">
                      {caseData.classification?.wrongdoing_type || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Whistleblower Role</p>
                    <p className="font-medium">
                      {caseData.classification?.whistleblower_role || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Evidence Available</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {caseData.classification?.evidence_available?.length > 0 ? (
                        caseData.classification.evidence_available.map((e, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                        ))
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Scale className="h-5 w-5 text-teal-600" />
                  Legal Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Protected Disclosure</p>
                    <div className="flex items-center gap-2 mt-1">
                      {caseData.legal_assessment?.likely_protected_disclosure ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 font-medium">Likely</span>
                        </>
                      ) : caseData.legal_assessment?.likely_protected_disclosure === false ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-700 font-medium">Unlikely</span>
                        </>
                      ) : (
                        <span>To be assessed</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Confidence</p>
                    <Badge variant="outline" className="mt-1">
                      {caseData.legal_assessment?.confidence || "Low"}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Prescribed Persons</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {caseData.legal_assessment?.prescribed_persons?.length > 0 ? (
                        caseData.legal_assessment.prescribed_persons.map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                        ))
                      ) : (
                        <span>None identified</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Overall</p>
                    <p className={`font-bold ${getRiskColor(caseData.risk_assessment?.overall_risk)}`}>
                      {caseData.risk_assessment?.overall_risk || "—"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Employment</p>
                    <p className={`font-bold ${getRiskColor(caseData.risk_assessment?.employment_risk)}`}>
                      {caseData.risk_assessment?.employment_risk || "—"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Retaliation</p>
                    <p className={`font-bold ${getRiskColor(caseData.risk_assessment?.retaliation_risk)}`}>
                      {caseData.risk_assessment?.retaliation_risk || "—"}
                    </p>
                  </div>
                </div>
                {caseData.risk_assessment?.risk_factors?.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-slate-700 mb-2">Risk Factors</p>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {caseData.risk_assessment.risk_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Conversation */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-teal-600" />
                  Triage Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.message_id || index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                            <User className="h-3 w-3" />
                            <span>{message.role === "user" ? "Whistleblower" : "AI Assistant"}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Notes */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Case Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-2">Update Status</p>
                  <Select
                    value={caseData.case_status}
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger data-testid="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Escalated">Escalated</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-slate-500 mb-1">Submitted</p>
                  <p className="font-medium">{formatDate(caseData.submitted_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Urgency</p>
                  <Badge variant="outline">
                    {caseData.ai_summary?.urgency_level || "Standard"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {caseData.ai_summary?.recommended_actions?.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  )) || <li className="text-slate-500">No recommendations</li>}
                </ul>
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="note-input"
                  />
                  <Button
                    className="w-full mt-2 bg-teal-600 hover:bg-teal-700"
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isAddingNote}
                    data-testid="add-note-button"
                  >
                    {isAddingNote ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Add Note
                  </Button>
                </div>
                <Separator />
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {caseData.notes?.length > 0 ? (
                      caseData.notes.map((note) => (
                        <div key={note.note_id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <User className="h-3 w-3" />
                            <span>{note.created_by_name}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(note.created_at)}</span>
                          </div>
                          <p className="text-sm">{note.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">No notes yet</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
