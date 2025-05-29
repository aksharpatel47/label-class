"use client";

import { ProjectLabel, Task } from "@/db/schema";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useContext, useEffect } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Map } from "lucide-react";
import { IGetTaskLabelReponse } from "@/app/api/tasks/[taskId]/labels/route";
import { SessionContext } from "@/app/(app)/session-context";
import { Session } from "lucia";
import { useToast } from "@/hooks/use-toast";

interface TaskLabel {
  value: TaskLabelValue;
  createdAt: Date;
  updatedAt: Date | null;
  labelId: string;
  taskId: string;
  labeledBy: {
    id: string;
    name: string;
  };
  labelUpdatedBy: {
    id: string;
    name: string;
  } | null;
}

const validLabelValues = ["Present", "Absent", "Difficult", "Skip"] as const;
type ValidLabelValues = (typeof validLabelValues)[number];
const taskLabelValues = [undefined, ...validLabelValues] as const;
type TaskLabelValue = (typeof taskLabelValues)[number];

type TaskLabels = Record<string, TaskLabel | undefined>;

type State = {
  loadingInitialLabels: boolean;
  savingLabels: boolean;
  taskLabels: TaskLabels;
  inferenceResult?: number;
};

type Actions = {
  setInitialLabels(taskLabels: TaskLabels): void;
  setLoadingInitialLabels(loading: boolean): void;
  cycleLabelValue(
    currentTaskId: string,
    labelId: string,
    session: Session,
    toast: any
  ): void;
  setLabelValue(
    currentaskId: string,
    labelId: string,
    value: string | undefined,
    session: Session,
    toast: any
  ): void;
  setInferenceResult(inference: number): void;
};

const useLabelTaskStore = create<State & Actions>()(
  immer((set) => ({
    index: 0,
    loadingInitialLabels: false,
    savingLabels: false,
    taskLabels: {},
    setLoadingInitialLabels(loading) {
      set((state) => {
        state.loadingInitialLabels = loading;
      });
    },
    setInitialLabels(taskLabels: TaskLabels) {
      set((state) => {
        state.taskLabels = taskLabels;
      });
    },
    cycleLabelValue(
      currentTaskId: string,
      labelId: string,
      session: Session,
      toast
    ) {
      set((state) => {
        const currentLabelValue = state.taskLabels[labelId]?.value;
        const currentLabelIndex = taskLabelValues.indexOf(currentLabelValue);
        const newLabelIndex = (currentLabelIndex + 1) % taskLabelValues.length;
        console.log(
          `Updating label ${labelId} to ${newLabelIndex} (${taskLabelValues[newLabelIndex]})`
        );
        const newLabelValue = taskLabelValues[newLabelIndex];
        if (newLabelValue === undefined) {
          delete state.taskLabels[labelId];
        } else if (!!state.taskLabels[labelId]) {
          state.taskLabels[labelId]!.value = newLabelValue;
          state.taskLabels[labelId]!.updatedAt = new Date();
          state.taskLabels[labelId]!.labelUpdatedBy = {
            id: session.user.userId,
            name: session.user.name,
          };
        } else {
          state.taskLabels[labelId] = {
            value: newLabelValue,
            createdAt: new Date(),
            updatedAt: new Date(),
            labelId: labelId,
            taskId: currentTaskId,
            labeledBy: {
              id: session.user.userId,
              name: session.user.name,
            },
            labelUpdatedBy: null,
          };
        }
        const method = !newLabelValue ? "DELETE" : "POST";
        fetch(`/api/tasks/${currentTaskId}/labels/${labelId}`, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: newLabelValue }),
        }).catch((error) => {
          // Use the toast function if provided
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to update label: ${error instanceof Error ? error.message : String(error)}`,
          });
        });
      });
    },

    setLabelValue(
      currentTaskId: string,
      labelId: string,
      value: TaskLabelValue,
      session: Session,
      toast
    ) {
      set((state) => {
        if (value === undefined) {
          delete state.taskLabels[labelId];
        } else if (!!state.taskLabels[labelId]) {
          state.taskLabels[labelId]!.value = value;
          state.taskLabels[labelId]!.updatedAt = new Date();
          state.taskLabels[labelId]!.labelUpdatedBy = {
            id: session.user.userId,
            name: session.user.name,
          };
        } else {
          state.taskLabels[labelId] = {
            value: value,
            createdAt: new Date(),
            updatedAt: new Date(),
            labelId: labelId,
            taskId: currentTaskId,
            labeledBy: {
              id: session.user.userId,
              name: session.user.name,
            },
            labelUpdatedBy: null,
          };
        }

        const method = "POST";
        fetch(`/api/tasks/${currentTaskId}/labels/${labelId}`, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          })
          .then(console.log)
          .catch((error) => {
            // Use the toast function if provided
            toast({
              variant: "destructive",
              title: "Error",
              description: `Failed to set label value: ${error instanceof Error ? error.message : String(error)}`,
            });
          });
      });
    },
    setInferenceResult(inference: number) {
      set((state) => {
        state.inferenceResult = inference;
      });
    },
  }))
);

export function LabelTask({
  task,
  nextTask,
  projectLabels,
  className,
  disableKeyboardShortcuts,
  selectedModelId,
}: {
  task: Task;
  nextTask?: Task;
  projectLabels: ProjectLabel[];
  className?: string;
  disableKeyboardShortcuts?: boolean;
  selectedModelId?: number;
}) {
  const session = useContext(SessionContext);
  const { toast } = useToast(); // Add toast hook

  const projectLabelKeys = projectLabels.reduce(
    (acc, d, i) => ({
      ...acc,
      [`${i + 1}`]: d.id,
    }),
    {}
  );

  const {
    taskLabels,
    loadingInitialLabels,
    inferenceResult,
    setLoadingInitialLabels,
    setInitialLabels,
    cycleLabelValue,
    setLabelValue,
    setInferenceResult,
  } = useLabelTaskStore();

  useEffect(() => {
    setLoadingInitialLabels(true);
    const labelUrl = `/api/tasks/${task.id}/labels`;

    fetch(labelUrl)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`HTTP error! Status: ${resp.status}`);
        }
        return resp.json();
      })
      .then((data: IGetTaskLabelReponse) => {
        const taskLabels: TaskLabels = {};
        data.forEach((l) => {
          taskLabels[l.labelId] = l;
        });
        setInitialLabels(taskLabels);
        setLoadingInitialLabels(false);
      })
      .catch((error) => {
        setLoadingInitialLabels(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load labels: ${error.message}`,
        });
      });

    if (selectedModelId) {
      fetch(`/api/tasks/${task.id}/models/${selectedModelId}/inference`)
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`HTTP error! Status: ${resp.status}`);
          }
          return resp.json();
        })
        .then((data) => {
          if (data.inference) {
            setInferenceResult(data.inference);
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to load inference data: ${error.message}`,
          });
        });
    }
  }, [task.id, selectedModelId]);

  function handleKeyDown(e: KeyboardEvent) {
    if (projectLabelKeys.hasOwnProperty(Number(e.key))) {
      cycleLabelValue(
        task.id,
        projectLabels[Number(e.key) - 1].id,
        session!,
        toast // Pass the toast function
      );
    }
  }

  useEffect(() => {
    if (disableKeyboardShortcuts) {
      return;
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [task.id]);

  const coordinate = extractLatLng(task.imageUrl);

  return (
    <div className={className + " mt-2"}>
      <div className="flex">
        <img
          src={task.imageUrl}
          alt={task.id}
          className="flex-1 w-[800px] h-[800px] object-contain"
        />

        <div className="flex flex-col flex-1 pl-8 gap-4">
          <div className="flex gap-2 w-[800px] text-wrap break-all">
            {task.name}
            {coordinate && (
              <a
                href={buildGoogleMapsUrl(coordinate)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Map />
              </a>
            )}
          </div>
          {!!selectedModelId && (
            <div>
              <span className="font-bold">Inference Result:</span>
              {inferenceResult ? (
                inferenceResult >= 5000 ? (
                  <span className="text-green-500">
                    {" "}
                    {inferenceResult / 100.0}%
                  </span>
                ) : (
                  <span className="text-red-500">
                    {" "}
                    {inferenceResult / 100.0}%
                  </span>
                )
              ) : (
                <span className="text-black"> No Inference</span>
              )}
            </div>
          )}
          {projectLabels.map((l, i) => (
            <div key={task.id + "-" + l.id} className="flex items-center gap-4">
              <span className="w-[150px]">
                ( {i + 1} ) &nbsp;
                {l.labelName} &nbsp;
              </span>
              <ToggleGroup
                variant="outline"
                type="single"
                value={taskLabels[l.id]?.value}
                onValueChange={(v) => {
                  setLabelValue(task.id, l.id, v, session!, toast); // Pass the toast function
                }}
                disabled={loadingInitialLabels}
              >
                {taskLabelValues.slice(1).map((pl) => (
                  <ToggleGroupItem key={pl} value={pl!}>
                    {pl}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="flex flex-col text-sm">
                {taskLabels[l.id] && (
                  <div>🏷️ {taskLabels[l.id]?.labeledBy.name}</div>
                )}
                {taskLabels[l.id]?.labelUpdatedBy &&
                  taskLabels[l.id]?.labelUpdatedBy?.name !=
                    taskLabels[l.id]?.labeledBy.name && (
                    <div>✍️ {taskLabels[l.id]?.labelUpdatedBy?.name}</div>
                  )}
              </div>
            </div>
          ))}
          {nextTask && (
            <>
              <div>Next Image...</div>
              <img
                src={nextTask.imageUrl}
                alt={nextTask.id}
                className="h-[100px] w-[100px]"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Coordinate pair
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Extract the first “_<lat>_<lng>” pair found anywhere in the URL.
 *
 * @param url  Any URL or path containing “…_<lat>_<lng>…”
 * @returns    The coordinates, or `null` if none found
 */
export function extractLatLng(url: string): LatLng | null {
  // underscore, ±DDD(.ddd…)?  underscore, ±DDD(.ddd…)?   (no anchor ⇒ anywhere)
  const regex = /_(-?\d{1,3}(?:\.\d+)?)_(-?\d{1,3}(?:\.\d+)?)/;
  const match = url.match(regex);
  if (!match) return null;

  const [, latStr, lngStr] = match;
  return {
    lat: parseFloat(latStr),
    lng: parseFloat(lngStr),
  };
}

/**
 * Produce a Google Maps link centered on the given coordinates.
 *
 * @param coords  `{ lat, lng }` from `extractLatLng`
 * @param zoom    Optional zoom level (Google Maps 1 – 21). Default = 17
 */
export function buildGoogleMapsUrl(coords: LatLng, zoom: number = 17): string {
  const { lat, lng } = coords;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&zoom=${zoom}`;
}
