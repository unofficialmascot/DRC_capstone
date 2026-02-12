import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  Building, 
  BookOpen,
  CheckCircle,
  XCircle,
  Download,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Application } from "@shared/schema";

interface ExtensionApplicationDetailProps {
  application: Application & {
    scholar?: {
      scholarId: string;
      name: string;
      email: string;
      phone: string;
      department: string;
      researchArea: string;
      researchTitle: string;
      phase: string;
      programme: string;
      joiningDate: string;
      supervisorName?: string;
      coSupervisorName?: string;
    };
    documents?: Array<{
      id: number;
      documentType: string;
      fileName: string;
      filePath: string;
      category: string;
    }>;
  };
  onApprove?: (remarks: string) => Promise<void>;
  onReject?: (remarks: string) => Promise<void>;
  canReview?: boolean;
}

export function ExtensionApplicationDetail({
  application,
  onApprove,
  onReject,
  canReview = false,
}: ExtensionApplicationDetailProps) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const details = application.details as any || {};
  const scholar = application.scholar;

  const handleReview = async () => {
    if (!remarks.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (reviewDecision === "approved" && onApprove) {
        await onApprove(remarks);
      } else if (reviewDecision === "rejected" && onReject) {
        await onReject(remarks);
      }
      setShowReviewDialog(false);
      setRemarks("");
    } catch (error) {
      console.error("Review failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewDialog = (decision: "approved" | "rejected") => {
    setReviewDecision(decision);
    setShowReviewDialog(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Ph.D Research Scholar Extension Application
          </h1>
          <p className="text-muted-foreground">
            Application ID: #{application.id} • Submitted on{" "}
            {new Date(application.submissionDate || "").toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge
          variant={
            application.status === "Approved"
              ? "default"
              : application.status === "Rejected"
              ? "destructive"
              : "secondary"
          }
          className="text-sm px-4 py-2"
        >
          {application.status}
        </Badge>
      </div>

      <div className="text-center py-4 border-b">
        <h2 className="text-2xl font-bold text-teal-700 uppercase tracking-wide">
          GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">(DEEMED TO BE UNIVERSITY)</p>
        <p className="text-sm font-medium mt-2">GITAM School of Technology - Hyderabad</p>
        <p className="text-xs text-muted-foreground mt-1">
          Accredited by NAAC with A+ Grade
        </p>
        <p className="text-xs text-muted-foreground">
          Rudraram, Patancheru Mandal, Sangareddy (Dist) - 502 329, T.S, INDIA
        </p>
      </div>

      {/* Section 1: Research Scholar Details */}
      <Card>
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            1. (a) Research Scholar details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-1/3">Name of the Candidate</TableCell>
                <TableCell>{scholar?.name || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Date of Registration and Department</TableCell>
                <TableCell>
                  {scholar?.joiningDate
                    ? new Date(scholar.joiningDate).toLocaleDateString("en-IN")
                    : "N/A"}
                  , {scholar?.department || "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Program Registration Category</TableCell>
                <TableCell>
                  {scholar?.programme || "N/A"}, PIN: {scholar?.scholarId || "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Phone No. & Email Id</TableCell>
                <TableCell>
                  {scholar?.phone || "N/A"}, {scholar?.email || "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Name of the Research Supervisor</TableCell>
                <TableCell>{scholar?.supervisorName || "Dr. Supervisor Name"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Work Place</TableCell>
                <TableCell>GITAM Hyderabad</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Name of the Co-guide/s</TableCell>
                <TableCell>{scholar?.coSupervisorName || "Dr. Co-Supervisor"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Area of Research</TableCell>
                <TableCell>{scholar?.researchArea || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Title of the Research work</TableCell>
                <TableCell>{scholar?.researchTitle || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Dates on Departmental Research Review meetings attended
                </TableCell>
                <TableCell>{details.reviewMeetingDates || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  No. of papers published in National & International peer reviewed
                </TableCell>
                <TableCell>{details.publications || "National: 1, International: 2"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 1(b): Extension Duration Required */}
      <Card>
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            1 (b) Extension duration required details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration Date</TableHead>
                <TableHead>Duration Eligible</TableHead>
                <TableHead>Required Extension till Date</TableHead>
                <TableHead>Duration of Extension (Required in years or months)</TableHead>
                <TableHead>No Due till Date (Yes/No)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  {scholar?.joiningDate
                    ? new Date(scholar.joiningDate).toLocaleDateString("en-IN")
                    : "N/A"}
                </TableCell>
                <TableCell>{details.durationEligible || "3 years"}</TableCell>
                <TableCell>
                  {details.extensionTillDate
                    ? new Date(details.extensionTillDate).toLocaleDateString("en-IN")
                    : "N/A"}
                </TableCell>
                <TableCell>{details.extensionDuration || "6 months"}</TableCell>
                <TableCell>
                  <Badge variant={details.noDueStatus === "Yes" ? "default" : "destructive"}>
                    {details.noDueStatus || "Yes"}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 2: Subjects/Courses */}
      <Card>
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            2. Subjects/ Courses taken and completed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">S.No.</TableHead>
                <TableHead>Name of Subject</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Semester/ year of completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.courses && details.courses.length > 0 ? (
                details.courses.map((course: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.result}</Badge>
                    </TableCell>
                    <TableCell>{course.semester}</TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>Research Methodology</TableCell>
                    <TableCell><Badge variant="outline">A</Badge></TableCell>
                    <TableCell>Semester 1, 2023</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2</TableCell>
                    <TableCell>Technical Writing</TableCell>
                    <TableCell><Badge variant="outline">A+</Badge></TableCell>
                    <TableCell>Semester 1, 2023</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>3</TableCell>
                    <TableCell>Advanced Research Techniques</TableCell>
                    <TableCell><Badge variant="outline">B+</Badge></TableCell>
                    <TableCell>Semester 2, 2024</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 3: Research Work Progress */}
      <Card>
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            3. Brief details of progress of Research Work
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-slate-50 p-4 rounded-lg min-h-[150px] text-sm text-slate-700 whitespace-pre-wrap">
            {details.researchProgress ||
              "Attach separate sheet bulleting the work done and quantum of work done duly signed by the Supervisor and Co-Supervisor"}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Publications */}
      <Card>
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            4. Details of Publications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Publications</TableHead>
                <TableHead>National</TableHead>
                <TableHead>International</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Journal Papers</TableCell>
                <TableCell>{details.nationalJournals || "1"}</TableCell>
                <TableCell>{details.internationalJournals || "2"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Conference Papers</TableCell>
                <TableCell>{details.nationalConferences || "0"}</TableCell>
                <TableCell>{details.internationalConferences || "1"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 5: Enclosures */}
      <Card>
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Enclosures
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {application.documents && application.documents.length > 0 ? (
            <div className="space-y-2">
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-sm">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {doc.documentType} • {doc.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No documents attached to this application</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Action Buttons */}
      {canReview && application.status === "Pending" && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Review Application</h3>
                <p className="text-sm text-muted-foreground">
                  Current Stage: <Badge variant="outline">{application.currentStage}</Badge>
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  onClick={() => openReviewDialog("rejected")}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject
                </Button>
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => openReviewDialog("approved")}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {reviewDecision === "approved" ? "Approve" : "Reject"} Application
            </DialogTitle>
            <DialogDescription>
              Please provide your remarks for this decision. This will be recorded in the
              application's review history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks *</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter your comments and feedback..."
                className="h-32"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={!remarks.trim() || isSubmitting}
              className={cn(
                reviewDecision === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isSubmitting ? "Submitting..." : `Confirm ${reviewDecision === "approved" ? "Approval" : "Rejection"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
