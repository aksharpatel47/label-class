"use client";

import { SessionContext } from "@/app/(app)/session-context";
import { IGetTaskLabelReponse } from "@/app/api/tasks/[taskId]/labels/route";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProjectLabel, Task } from "@/db/schema";
import { ValidateRequestResult } from "@/lib/auth/auth";
import { Flag, Map } from "lucide-react";
import Image from "next/image";
import { useContext, useEffect } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface TaskLabel {
  value: TaskLabelValue;
  createdAt: Date;
  updatedAt: Date | null;
  labelId: string;
  taskId: string;
  flag: boolean;
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
    session: ValidateRequestResult
  ): void;
  setLabelValue(
    currentaskId: string,
    labelId: string,
    value: string | undefined,
    session: ValidateRequestResult
  ): void;
  setInferenceResult(inference: number): void;
  setTaskLabelFlag(
    currentTaskId: string,
    labelId: string,
    flag: boolean,
    session: ValidateRequestResult
  ): void;
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
      session: ValidateRequestResult
    ) {
      const currentLabelValue =
        useLabelTaskStore.getState().taskLabels[labelId]?.value;
      // If no label exists yet, treat it as undefined (index 0)
      const currentLabelIndex =
        currentLabelValue === undefined
          ? 0
          : taskLabelValues.indexOf(currentLabelValue);
      const newLabelIndex = (currentLabelIndex + 1) % taskLabelValues.length;
      console.log(
        `Updating label ${labelId} from ${currentLabelIndex} (${currentLabelValue}) to ${newLabelIndex} (${taskLabelValues[newLabelIndex]})`
      );
      const newLabelValue = taskLabelValues[newLabelIndex];

      // Optimistically update state first
      const prevLabel = structuredClone(
        useLabelTaskStore.getState().taskLabels[labelId]
      );

      set((state) => {
        if (newLabelValue === undefined) {
          delete state.taskLabels[labelId];
        } else if (!!state.taskLabels[labelId]) {
          state.taskLabels[labelId]!.value = newLabelValue;
          state.taskLabels[labelId]!.updatedAt = new Date();
          state.taskLabels[labelId]!.labelUpdatedBy = {
            id: session!.user.id,
            name: session!.user.name,
          };
        } else {
          state.taskLabels[labelId] = {
            value: newLabelValue,
            createdAt: new Date(),
            updatedAt: new Date(),
            labelId: labelId,
            taskId: currentTaskId,
            flag: false,
            labeledBy: {
              id: session!.user.id,
              name: session!.user.name,
            },
            labelUpdatedBy: null,
          };
        }
      });

      const method = !newLabelValue ? "DELETE" : "POST";
      fetch(`/api/tasks/${currentTaskId}/labels/${labelId}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: newLabelValue }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            // Rollback on error
            set((state) => {
              if (prevLabel === undefined) {
                delete state.taskLabels[labelId];
              } else {
                state.taskLabels[labelId] = prevLabel;
              }
            });
            toast.error(data.error);
            return;
          }
          // Success: state already updated optimistically
        })
        .catch((error) => {
          // Rollback on network failure
          set((state) => {
            if (prevLabel === undefined) {
              delete state.taskLabels[labelId];
            } else {
              state.taskLabels[labelId] = prevLabel;
            }
          });
          toast.error(`Failed to set/update label value`);
          console.error(error);
        });
    },

    setLabelValue(
      currentTaskId: string,
      labelId: string,
      value: TaskLabelValue,
      session: ValidateRequestResult
    ) {
      const method = !value ? "DELETE" : "POST";
      fetch(`/api/tasks/${currentTaskId}/labels/${labelId}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error);
            return;
          }

          // Only update state if API call was successful
          set((state) => {
            if (!value) {
              delete state.taskLabels[labelId];
            } else if (!!state.taskLabels[labelId]) {
              state.taskLabels[labelId]!.value = value;
              state.taskLabels[labelId]!.updatedAt = new Date();
              state.taskLabels[labelId]!.labelUpdatedBy = {
                id: session!.user.id,
                name: session!.user.name,
              };
            } else {
              state.taskLabels[labelId] = {
                value: value,
                createdAt: new Date(),
                updatedAt: new Date(),
                labelId: labelId,
                taskId: currentTaskId,
                flag: false,
                labeledBy: {
                  id: session!.user.id,
                  name: session!.user.name,
                },
                labelUpdatedBy: null,
              };
            }
          });
        })
        .catch((error) => {
          toast.error(`Failed to set/update label value`);
          console.error(error);
        });
    },
    setInferenceResult(inference: number) {
      set((state) => {
        state.inferenceResult = inference;
      });
    },
    setTaskLabelFlag(
      currentTaskId: string,
      labelId: string,
      flag: boolean,
      session: ValidateRequestResult
    ) {
      fetch(`/api/tasks/${currentTaskId}/labels/${labelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flag }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error);
            return;
          }

          // Only update state if API call was successful
          set((state) => {
            if (!!state.taskLabels[labelId]) {
              state.taskLabels[labelId]!.flag = flag;
            }
          });
        })
        .catch((error) => {
          toast.error(`Failed to set/update label flag`);
          console.error(error);
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
    setTaskLabelFlag,
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
        toast.error(`Failed to load labels: ${error.message}`);
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
          toast.error(`Failed to load inference data: ${error.message}`);
        });
    }
  }, [
    task.id,
    selectedModelId,
    setInferenceResult,
    setInitialLabels,
    setLoadingInitialLabels,
  ]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (projectLabelKeys.hasOwnProperty(Number(e.key))) {
        cycleLabelValue(task.id, projectLabels[Number(e.key) - 1].id, session!);
      }
    }

    if (disableKeyboardShortcuts) {
      return;
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    task.id,
    disableKeyboardShortcuts,
    cycleLabelValue,
    projectLabels,
    projectLabelKeys,
    session,
  ]); // Reattach listener if task ID or disable flag changes

  const coordinate = extractLatLng(task.imageUrl);

  return (
    <div className={className + " mt-2"}>
      <div className="flex">
        <Image
          src={task.imageUrl}
          alt={task.id}
          height={800}
          width={800}
          className="flex-1 object-contain"
          unoptimized
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
                  setLabelValue(task.id, l.id, v, session!); // Pass the toast function
                }}
                disabled={loadingInitialLabels}
              >
                {taskLabelValues.slice(1).map((pl) => (
                  <ToggleGroupItem key={pl} value={pl!}>
                    {pl}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {!!taskLabels[l.id] ? (
                <Toggle
                  pressed={taskLabels[l.id]?.flag}
                  onPressedChange={(flag) => {
                    setTaskLabelFlag(task.id, l.id, flag, session!);
                  }}
                >
                  {taskLabels[l.id]?.flag ? (
                    <Flag style={{ color: "red" }} />
                  ) : (
                    <Flag style={{ color: "grey" }} />
                  )}
                </Toggle>
              ) : null}

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
              <Image
                src={nextTask.imageUrl}
                alt={nextTask.id}
                height={100}
                width={100}
                className="object-contain"
                unoptimized
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
 * Extract the first "<lat>_<lng>" pair found anywhere in the URL or filename.
 * Handles coordinates that appear at the start (e.g. "39.38_-76.52_180_0.jpg")
 * or after an underscore (e.g. "..._39.38_-76.52_0_0.jpg").
 *
 * @param url  Any URL or path containing "<lat>_<lng>"
 * @returns    The coordinates, or `null` if none found
 */
export function extractLatLng(url: string): LatLng | null {
  // Match lat_lng pattern: ±DDD(.ddd…)?_±DDD(.ddd…)?
  // Uses lookbehind to ensure we're at start of string or after underscore
  const regex = /(?:^|(?<=_))(-?\d{1,3}(?:\.\d+)?)_(-?\d{1,3}(?:\.\d+)?)/;
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
