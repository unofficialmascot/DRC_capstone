import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson, apiRequest } from "@/lib/api";
import { api, appendQuery, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type {
  Application,
  ApplicationFormType,
  EligibilityStatus,
  User,
} from "@/types/gscholar";
import {
  ExtensionForm,
  PreTalkForm,
  ReRegistrationForm,
  SupervisorChangeForm,
} from "@/pages/home/ScholarApplicationForms";

const applicationFormTitles: Record<ApplicationFormType, string> = {
  supervisor: "Change of Supervisor",
  pretalk: "Pre-talk Application",
  extension: "Extension Application",
  reregistration: "Re-Registration Application",
};

const applicationSubmitTypes: Record<ApplicationFormType, string> = {
  supervisor: "Supervisor Change",
  pretalk: "Pre-Talk",
  extension: "Extension",
  reregistration: "Re-Registration",
};

interface ScholarApplicationFormPageProps {
  user: User;
  formType: ApplicationFormType;
  onBack: () => void;
}

export default function ScholarApplicationFormPage({
  user,
  formType,
  onBack,
}: ScholarApplicationFormPageProps) {
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(
    formType === "extension",
  );
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useQuery<Application[]>({
    queryKey: [api.applications.list.path, { userId: user.id }],
    queryFn: () => {
      const query = api.applications.list.input?.parse({ userId: user.id });
      return apiJson<Application[]>(appendQuery(api.applications.list.path, query), {
        method: api.applications.list.method,
      });
    },
  });

  useEffect(() => {
    const checkEligibility = async () => {
      if (formType !== "extension") {
        return;
      }
      try {
        setEligibilityLoading(true);
        setEligibilityError(null);
        const scholarIdentifier = user.scholarId ?? String(user.id);
        const data = await apiJson<any>(
          buildUrl(api.extensions.checkEligibility.path, { scholarIdentifier }),
          { method: api.extensions.checkEligibility.method },
        );
        setEligibility(data.eligibility);
      } catch (error: any) {
        setEligibilityError(error?.message || "Failed to check eligibility");
      } finally {
        setEligibilityLoading(false);
      }
    };

    checkEligibility();
  }, [formType, user.id, user.scholarId]);

  const submitMutation = useMutation({
    mutationFn: async (data: { type: string; details: Record<string, unknown> }) => {
      const res = await apiRequest("/api/applications", {
        method: "POST",
        body: {
          userId: user.id,
          type: data.type,
          details: data.details,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application submitted",
        description:
          "Your application was submitted successfully and will be reviewed by the Supervisor.",
      });
    },
    onError: (error: any) => {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Failed to submit application";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const renderForm = () => {
    const submitType = applicationSubmitTypes[formType];
    switch (formType) {
      case "extension":
        return (
          <ExtensionForm
            user={user}
            onSubmit={(details) =>
              submitMutation.mutate({ type: submitType, details })
            }
            onBack={onBack}
            isSubmitting={submitMutation.isPending}
          />
        );
      case "supervisor":
        return (
          <SupervisorChangeForm
            user={user}
            onSubmit={(details) =>
              submitMutation.mutate({ type: submitType, details })
            }
            onBack={onBack}
            isSubmitting={submitMutation.isPending}
          />
        );
      case "pretalk":
        return (
          <PreTalkForm
            user={user}
            onSubmit={(details) =>
              submitMutation.mutate({ type: submitType, details })
            }
            onBack={onBack}
            isSubmitting={submitMutation.isPending}
          />
        );
      case "reregistration":
        return (
          <ReRegistrationForm
            user={user}
            onSubmit={(details) =>
              submitMutation.mutate({ type: submitType, details })
            }
            onBack={onBack}
            isSubmitting={submitMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="applications-container">
      <div className="applications-title">{applicationFormTitles[formType]}</div>

      {formType === "extension" && eligibilityLoading && (
        <div className="form-message">Checking extension eligibility...</div>
      )}

      {formType === "extension" && !eligibilityLoading && eligibilityError && (
        <div className="form-container form-message-block">
          <p className="form-error-message">{eligibilityError}</p>
          <button className="submit-btn btn-secondary" onClick={onBack}>
            Back
          </button>
        </div>
      )}

      {formType === "extension" &&
      !eligibilityLoading &&
      eligibility &&
      !eligibility.isEligible ? (
        <div className="form-container form-message-block">
          <h3 className="form-error-title">Extension Not Eligible</h3>
          <p className="form-error-text">
            {eligibility.issues?.[0] ||
              "You are not eligible for a Ph.D extension at this time."}
          </p>
          <button className="submit-btn btn-secondary" onClick={onBack}>
            Back
          </button>
        </div>
      ) : null}

      {formType !== "extension" ||
      (!eligibilityLoading && !eligibilityError && (!eligibility || eligibility.isEligible))
        ? renderForm()
        : null}
    </div>
  );
}
