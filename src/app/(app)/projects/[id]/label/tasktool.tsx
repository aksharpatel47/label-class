"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectLabel } from "@/db/schema";
import type { fetchTasksForLabeling } from "@/lib/data/tasks";
import { Label } from "@radix-ui/react-label";
import { Terminal } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { set } from "zod";

export function TaskTool({
  projectId,
  tasks,
  labels,
}: {
  projectId: string;
  tasks: Awaited<ReturnType<typeof fetchTasksForLabeling>>;
  labels: ProjectLabel[];
}) {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showReloadText, setShowReloadText] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const router = useRouter();

  function goForward() {
    if (index === tasks.length - 1) {
      setShowReloadText(true);
    } else {
      setIndex(index + 1);
      resetLabels();
    }
  }

  function goBack() {
    if (index === 0) return;
    setIndex(index - 1);
    resetLabels();
    setShowReloadText(false);
  }

  function resetLabels() {
    setSelectedLabels([]);
  }

  function handleLabelClick(i: number) {
    setLoading(true);
    fetch(
      `/api/projects/${projectId}/tasks/${tasks[index].id}/labels/${labels[i].id}`,
      {
        method: "POST",
      }
    ).then((res) => {
      setSelectedLabels((prev) => {
        if (prev.includes(i)) {
          return prev.filter((index) => index !== i);
        } else {
          return [...prev, i];
        }
      });
      setLoading(false);
    });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      goForward();
    } else if (e.key === "ArrowLeft") {
      goBack();
    } else if (
      [...Array(labels.length).keys()].map((i) => String(i + 1)).includes(e.key)
    ) {
      handleLabelClick(Number(e.key) - 1);
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [index, selectedLabels, router]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/tasks/${tasks[index].id}/labels`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setSelectedLabels(data.map((l: any) => l.label.sequence) || []);
        setLoading(false);
      });
  }, [index]);

  return (
    <>
      {showReloadText && (
        <Alert className="mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Finished labeling 50 images.</AlertTitle>
          <AlertDescription>
            You can either review them by going back or continue labeling more
            images by reloading this page. Press F5 to reload. Press the left
            arrow key to go back or the right arrow key to go forward.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex">
        <Image
          src={tasks[index].imageUrl}
          alt={tasks[index].id}
          height={600}
          width={600}
        />
        <form className="flex flex-col flex-1 gap-2">
          {labels.map((l, i) => (
            <div key={l.id} className="flex">
              <Input
                type="checkbox"
                id={l.id}
                name="label"
                value={l.id}
                className="flex-1"
                checked={selectedLabels.includes(i)}
                onChange={() => handleLabelClick(i)}
                disabled={loading}
              />
              <Label htmlFor={l.id} className="flex-1">
                ( <span className="underline">{i + 1}</span> ) &nbsp;
                {l.labelName}
              </Label>
            </div>
          ))}
        </form>
      </div>

      <div className="flex mt-8 gap-8">
        <Button onClick={goBack} disabled={index === 0} className="flex-1">
          ( ← ) Previous
        </Button>
        <Button
          onClick={goForward}
          className="flex-1"
          disabled={showReloadText}
        >
          ( → ) Next
        </Button>
      </div>
    </>
  );
}
