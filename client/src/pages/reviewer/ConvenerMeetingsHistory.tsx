import { useMemo, useState } from "react";
import { api, buildUrl } from "@shared/routes";
import {
  useCloseDrcMeeting,
  useDrcMeetingsList,
} from "@/hooks/use-application-reviews";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConvenerMeetingsHistory({ role }: { role: string }) {
  const canViewMeetings = role === "drc_convener" || role === "admin";
  const [activeTab, setActiveTab] = useState("active");
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: meetings = [],
    isLoading: isMeetingsLoading,
    isError: isMeetingsError,
    error: meetingsError,
  } = useDrcMeetingsList(canViewMeetings);
  const closeMeetingMutation = useCloseDrcMeeting();

  const { activeMeeting, pastMeetings, activeMeetingCount } = useMemo(() => {
    const activeMeetings = meetings.filter((meeting) => !meeting.closedAt);
    const closedMeetings = meetings.filter((meeting) => Boolean(meeting.closedAt));

    return {
      activeMeeting: activeMeetings[0] ?? null,
      pastMeetings: closedMeetings,
      activeMeetingCount: activeMeetings.length,
    };
  }, [meetings]);

  const handleDownloadAgendaPdf = (meetingId: number) => {
    const pdfUrl = buildUrl(api.drcMeetings.downloadAgendaPdf.path, { id: meetingId });
    window.open(pdfUrl, "_blank");
  };

  const handleCloseMeeting = () => {
    if (!activeMeeting) {
      return;
    }

    closeMeetingMutation.mutate(activeMeeting.id, {
      onSuccess: () => {
        setIsCloseDialogOpen(false);
        toast({
          title: "Success",
          description: "Meeting closed successfully.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to close meeting.",
          variant: "destructive",
        });
      },
    });
  };

  if (!canViewMeetings) {
    return (
      <div style={{ padding: "20px" }}>
        <div style={{ textAlign: "center", padding: "40px", color: "#666", background: "#fff", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
          Meetings history is available only for DRC convener role.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#0b6a55", marginBottom: "20px" }}>DRC Meetings History</h2>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #e6e6e6" }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active-meetings">
              Active ({activeMeetingCount})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past-meetings">
              Past ({pastMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isMeetingsLoading ? (
              <div style={{ color: "#666", marginTop: "12px" }}>Loading meetings...</div>
            ) : isMeetingsError ? (
              <div style={{ color: "#b42318", marginTop: "12px" }}>
                {(meetingsError as Error).message || "Failed to load active meetings."}
              </div>
            ) : !activeMeeting ? (
              <div style={{ color: "#666", marginTop: "12px" }}>No active meeting available right now.</div>
            ) : (
              <div style={{ marginTop: "12px", border: "1px solid #e6e6e6", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontWeight: "600", marginBottom: "6px" }}>Meeting #{activeMeeting.id}</div>
                <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
                  Date: {new Date(activeMeeting.meetingDate as unknown as string).toLocaleString()} | Status: Open
                </div>
                {activeMeetingCount > 1 && (
                  <div style={{ color: "#8a5a00", background: "#fff6e5", border: "1px solid #f4d28a", borderRadius: "6px", padding: "8px", marginBottom: "8px", fontSize: "13px" }}>
                    Multiple active meetings were found. Please close the current active meeting immediately.
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="submit-btn"
                    onClick={() => handleDownloadAgendaPdf(activeMeeting.id)}
                    data-testid={`button-download-active-meeting-pdf-${activeMeeting.id}`}
                  >
                    Download Agenda PDF
                  </button>
                  <button
                    type="button"
                    className="submit-btn"
                    style={{ background: "#e67e22" }}
                    onClick={() => setIsCloseDialogOpen(true)}
                    disabled={closeMeetingMutation.isPending}
                    data-testid="button-close-active-meeting"
                  >
                    {closeMeetingMutation.isPending ? "Closing..." : "Close Active Meeting"}
                  </button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {isMeetingsLoading ? (
              <div style={{ color: "#666", marginTop: "12px" }}>Loading meetings...</div>
            ) : isMeetingsError ? (
              <div style={{ color: "#b42318", marginTop: "12px" }}>
                {(meetingsError as Error).message || "Failed to load past meetings."}
              </div>
            ) : pastMeetings.length === 0 ? (
              <div style={{ color: "#666", marginTop: "12px" }}>No past meetings available yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {pastMeetings.map((meeting) => (
                  <div key={meeting.id} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontWeight: "600", marginBottom: "6px" }}>Meeting #{meeting.id}</div>
                    <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
                      Date: {new Date(meeting.meetingDate as unknown as string).toLocaleString()} | Closed: {new Date(meeting.closedAt as unknown as string).toLocaleString()}
                    </div>
                    <button
                      type="button"
                      className="submit-btn"
                      onClick={() => handleDownloadAgendaPdf(meeting.id)}
                      data-testid={`button-download-past-meeting-pdf-${meeting.id}`}
                    >
                      Download Agenda PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close active meeting now?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will close the currently active DRC meeting immediately. Please confirm to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeMeetingMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseMeeting}
              disabled={closeMeetingMutation.isPending || !activeMeeting}
              data-testid="button-confirm-close-active-meeting"
            >
              {closeMeetingMutation.isPending ? "Closing..." : "Confirm Close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
