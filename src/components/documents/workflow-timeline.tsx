"use client";

import {
  Upload,
  FileType2,
  SplitSquareHorizontal,
  Brain,
  Database,
  CheckCircle2,
} from "lucide-react";

type Step =
  | "upload"
  | "processing"
  | "splitting"
  | "embedding"
  | "storing"
  | "complete";

interface WorkflowTimelineProps {
  currentStep: Step;
  fileName?: string;
  processingMethod?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  startTime?: Date;
}

interface TimelineStep {
  id: number;
  step: Step;
  title: string;
  description: (props: WorkflowTimelineProps) => string;
  icon: React.ElementType;
  iconBackground: string;
}

const timelineSteps: TimelineStep[] = [
  {
    id: 1,
    step: "upload",
    title: "File Upload",
    description: (props) =>
      `Uploading ${props.fileName || "document"} to the server`,
    icon: Upload,
    iconBackground: "bg-blue-500",
  },
  {
    id: 2,
    step: "processing",
    title: "Processing",
    description: (props) =>
      `Processing ${props.fileName || "document"} using ${
        props.processingMethod || "default"
      } method`,
    icon: FileType2,
    iconBackground: "bg-yellow-500",
  },
  {
    id: 3,
    step: "splitting",
    title: "Text Splitting",
    description: (props) =>
      `Splitting text into chunks of ${
        props.chunkSize || 1000
      } characters with ${props.chunkOverlap || 200} overlap`,
    icon: SplitSquareHorizontal,
    iconBackground: "bg-purple-500",
  },
  {
    id: 4,
    step: "embedding",
    title: "Embedding Generation",
    description: () => "Generating vector embeddings using the Ollama model",
    icon: Brain,
    iconBackground: "bg-pink-500",
  },
  {
    id: 5,
    step: "storing",
    title: "Storing in ChromaDB",
    description: () => "Saving document and embeddings to the collection",
    icon: Database,
    iconBackground: "bg-indigo-500",
  },
  {
    id: 6,
    step: "complete",
    title: "Process Complete",
    description: () => "Document has been successfully processed and stored",
    icon: CheckCircle2,
    iconBackground: "bg-green-500",
  },
];

function getStepIndex(currentStep: Step): number {
  const index = timelineSteps.findIndex((step) => step.step === currentStep);
  return index >= 0 ? index : 0;
}

export function WorkflowTimeline(props: WorkflowTimelineProps) {
  const currentStepIndex = getStepIndex(props.currentStep);

  function getStepStatus(index: number) {
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "current";
    return "upcoming";
  }

  function getIconClass(status: string) {
    if (status === "completed") return "bg-green-500";
    if (status === "current") return "animate-pulse";
    return "bg-gray-300";
  }

  function getLineClass(status: string) {
    if (status === "completed") return "bg-green-500";
    return "bg-gray-200";
  }

  return (
    <div className="flow-root mt-4 mb-8">
      <ul role="list" className="-mb-8">
        {timelineSteps.map((event, eventIdx) => {
          const status = getStepStatus(eventIdx);
          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== timelineSteps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${getLineClass(
                      status
                    )}`}
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${
                        event.iconBackground
                      } ${getIconClass(status)}`}
                    >
                      <event.icon
                        className="h-5 w-5 text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p
                        className={`text-sm ${
                          status === "upcoming"
                            ? "text-gray-500"
                            : "text-gray-900 font-medium"
                        }`}
                      >
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {event.description(props)}
                      </p>
                    </div>
                    {status === "current" && (
                      <div className="text-right text-sm font-medium text-blue-500">
                        In progress
                      </div>
                    )}
                    {status === "completed" && (
                      <div className="text-right text-sm font-medium text-green-500">
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
