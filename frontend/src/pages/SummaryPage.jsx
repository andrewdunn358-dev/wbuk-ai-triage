import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldCheck, 
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Copy,
  Scale,
  Upload
} from "lucide-react";
import { generateSummary, submitCase, verifySession } from "@/lib/api";
import { toast } from "sonner";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function SummaryPage() {
  const navigate = useNavigate();
  const { sessionToken } = useParams();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [caseReference, setCaseReference] = useState(null);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [uploadedEvidence, setUploadedEvidence] = useState([]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!sessionToken) {
        navigate("/");
        return;
      }

      try {
        await verifySession(sessionToken);
        const summaryData = await generateSummary(sessionToken);
        setSummary(summaryData);
      } catch (error) {
        console.error("Failed to generate summary:", error);
        if (error.response?.status === 400) {
          toast.error("Please continue the conversation before viewing the summary.");
          navigate(`/chat/${sessionToken}`);
        } else {
          toast.error("Failed to generate summary. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, [sessionToken, navigate]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitCase(sessionToken);
      setCaseReference(result.case_reference);
      setSubmitted(true);
      toast.success("Case submitted successfully!");
    } catch (error) {
      console.error("Failed to submit case:", error);
      toast.error("Failed to submit case. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReference = () => {
    if (caseReference) {
      navigator.clipboard.writeText(caseReference);
      toast.success("Reference copied to clipboard");
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-wbuk-red mx-auto mb-4" />
          <p className="text-gray-600">Generating your case summary...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full rounded-none border-t-4 border-t-wbuk-red">
          <CardContent className="pt-8 pb-8 px-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-wbuk-red" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
              Case Submitted
            </h2>
            <p className="text-gray-600 mb-6">
              Your case has been submitted to WBUK advisors for review.
            </p>
            
            <div className="bg-gray-50 p-4 mb-6">
              <p className="text-sm text-gray-500 mb-2">Your Case Reference</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-bold text-gray-900" data-testid="case-reference">
                  {caseReference}
                </span>
                <Button variant="ghost" size="icon" onClick={copyReference} data-testid="copy-reference-button">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Please save this reference number. You can use it if you need to follow up on your case.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/")} className="bg-wbuk-red hover:bg-red-700 rounded-none" data-testid="return-home-button">
                Return to Home
              </Button>
              <Button variant="outline" className="rounded-none" onClick={() => window.open("https://wbuk.org/contact-us", "_blank")}>
                Contact WBUK
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b-4 border-wbuk-red">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(`/chat/${sessionToken}`)}
              className="hover:bg-red-50"
              data-testid="back-to-chat-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-wbuk-red" />
              <span className="font-heading font-bold text-gray-900">Case Summary</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-8">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Review Before Submitting</p>
            <p className="text-amber-700">
              This is an AI-generated assessment. Please review carefully before submitting to WBUK advisors.
            </p>
          </div>
        </div>

        {summary && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <Card className="rounded-none border-t-4 border-t-wbuk-red">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-wbuk-red" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {summary.executive_summary || "Summary not available"}
                </p>
              </CardContent>
            </Card>

            {/* Classification & Legal Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Classification */}
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Classification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Organisation Sector</p>
                    <p className="font-medium text-gray-900">
                      {summary.classification?.organisation_sector || "Not specified"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Type of Wrongdoing</p>
                    <p className="font-medium text-gray-900">
                      {summary.classification?.wrongdoing_type || "Not specified"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Your Role</p>
                    <p className="font-medium text-gray-900">
                      {summary.classification?.whistleblower_role || "Not specified"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Evidence Available</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {summary.classification?.evidence_available?.length > 0 ? (
                        summary.classification.evidence_available.map((evidence, i) => (
                          <Badge key={i} variant="outline">{evidence}</Badge>
                        ))
                      ) : (
                        <span className="text-gray-600">None specified</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Assessment */}
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Scale className="h-5 w-5 text-wbuk-red" />
                    Legal Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Protected Disclosure</p>
                    <div className="flex items-center gap-2 mt-1">
                      {summary.legal_assessment?.likely_protected_disclosure ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-700">Likely Qualifies</span>
                        </>
                      ) : summary.legal_assessment?.likely_protected_disclosure === false ? (
                        <>
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                          <span className="font-medium text-amber-700">May Not Qualify</span>
                        </>
                      ) : (
                        <span className="text-gray-600">To be assessed</span>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Confidence Level</p>
                    <Badge variant="outline" className="mt-1">
                      {summary.legal_assessment?.confidence || "Low"}
                    </Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Relevant Legislation</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {summary.legal_assessment?.relevant_legislation?.map((leg, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{leg}</Badge>
                      )) || <span className="text-gray-600">PIDA 1998</span>}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Prescribed Persons (Regulators)</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {summary.legal_assessment?.prescribed_persons?.length > 0 ? (
                        summary.legal_assessment.prescribed_persons.map((person, i) => (
                          <Badge key={i} variant="outline">{person}</Badge>
                        ))
                      ) : (
                        <span className="text-gray-600">To be determined</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Assessment */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Overall Risk</p>
                    <Badge className={getRiskColor(summary.risk_assessment?.overall_risk)}>
                      {summary.risk_assessment?.overall_risk || "Unknown"}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Employment Risk</p>
                    <Badge className={getRiskColor(summary.risk_assessment?.employment_risk)}>
                      {summary.risk_assessment?.employment_risk || "Unknown"}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Retaliation Risk</p>
                    <Badge className={getRiskColor(summary.risk_assessment?.retaliation_risk)}>
                      {summary.risk_assessment?.retaliation_risk || "Unknown"}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Urgency</p>
                    <Badge variant="outline">
                      {summary.urgency || "Standard"}
                    </Badge>
                  </div>
                </div>
                
                {summary.risk_assessment?.risk_factors?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Risk Factors</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {summary.risk_assessment.risk_factors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Actions */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="font-heading">Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {summary.recommended_actions?.map((action, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-wbuk-red flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{action}</span>
                    </li>
                  )) || (
                    <li className="text-gray-600">Continue conversation for recommendations</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Evidence Upload Section */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Upload className="h-5 w-5 text-wbuk-red" />
                  Supporting Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showEvidenceUpload ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">
                      Do you have documents, emails, or other evidence to support your disclosure?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowEvidenceUpload(true)}
                        className="rounded-none border-wbuk-red text-wbuk-red hover:bg-red-50"
                        data-testid="show-upload-button"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Evidence
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {}}
                        className="text-gray-500"
                      >
                        Skip for now
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <EvidenceUpload 
                      sessionToken={sessionToken}
                      onUploadComplete={(files) => {
                        setUploadedEvidence(prev => [...prev, ...files]);
                      }}
                    />
                    {uploadedEvidence.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Uploaded: {uploadedEvidence.length} file(s)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 rounded-none"
                onClick={() => navigate(`/chat/${sessionToken}`)}
                data-testid="continue-chat-button"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Continue Conversation
              </Button>
              <Button 
                className="flex-1 bg-wbuk-red hover:bg-red-700 rounded-none"
                onClick={handleSubmit}
                disabled={isSubmitting}
                data-testid="submit-case-button"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit to WBUK Advisors
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
