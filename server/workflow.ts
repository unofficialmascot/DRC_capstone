export type WorkflowStage = "supervisor" | "drc" | "irc" | "doaa" | "completed";
export type WorkflowDecision = "approved" | "rejected";

export interface WorkflowDefinition {
  id: string;
  stages: WorkflowStage[];
  stageRoles: Record<WorkflowStage, string[]>;
  terminalStage: WorkflowStage;
}

export interface WorkflowEvaluationInput {
  currentStage: WorkflowStage;
  decision: WorkflowDecision;
}

export interface WorkflowEvaluationResult {
  nextStage: WorkflowStage;
  status: "Pending" | "Approved" | "Rejected";
  finalOutcome: "Approved" | "Rejected" | null;
  isTerminal: boolean;
}

const baseWorkflow: WorkflowDefinition = {
  id: "phd-approval",
  stages: ["supervisor", "drc", "irc", "doaa", "completed"],
  stageRoles: {
    supervisor: ["supervisor"],
    drc: ["drc"],
    irc: ["irc", "irc_convener", "irc_chairman"],
    doaa: ["doaa"],
    completed: [],
  },
  terminalStage: "completed",
};

const thesisSubmissionWorkflow: WorkflowDefinition = {
  id: "thesis-submission",
  stages: ["supervisor", "drc", "irc", "doaa", "completed"],
  stageRoles: {
    supervisor: ["supervisor"],
    drc: ["drc"],
    irc: ["irc", "irc_convener", "irc_chairman"],
    doaa: ["doaa"],
    completed: [],
  },
  terminalStage: "completed",
};

const workflowByApplicationType: Record<string, WorkflowDefinition> = {
  "Thesis Submission": thesisSubmissionWorkflow,
};

export function getWorkflowDefinition(applicationType: string): WorkflowDefinition {
  return workflowByApplicationType[applicationType] ?? baseWorkflow;
}

export function isRoleAuthorized(
  workflow: WorkflowDefinition,
  stage: WorkflowStage,
  role: string,
): boolean {
  if (role === "admin") {
    return true;
  }

  return workflow.stageRoles[stage]?.includes(role) ?? false;
}

export function evaluateWorkflowDecision(
  workflow: WorkflowDefinition,
  input: WorkflowEvaluationInput,
): WorkflowEvaluationResult {
  const { currentStage, decision } = input;

  if (decision === "rejected") {
    return {
      nextStage: workflow.terminalStage,
      status: "Rejected",
      finalOutcome: "Rejected",
      isTerminal: true,
    };
  }

  const currentIndex = workflow.stages.indexOf(currentStage);
  const nextStage = workflow.stages[Math.min(currentIndex + 1, workflow.stages.length - 1)];
  const isTerminal = nextStage === workflow.terminalStage;

  return {
    nextStage,
    status: isTerminal ? "Approved" : "Pending",
    finalOutcome: isTerminal ? "Approved" : null,
    isTerminal,
  };
}
