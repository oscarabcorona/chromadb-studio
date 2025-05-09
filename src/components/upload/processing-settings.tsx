"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProcessingSettings, ProcessingMethod } from "@/types/document-upload";
import { PROCESSING_METHOD_INFO } from "@/lib/document-processing";

interface ProcessingSettingsFormProps {
  settings: ProcessingSettings;
  onSettingsChange: (settings: Partial<ProcessingSettings>) => void;
}

export function ProcessingSettingsForm({
  settings,
  onSettingsChange,
}: ProcessingSettingsFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chunkSize">Chunk Size</Label>
        <div className="flex items-center gap-2">
          <Input
            id="chunkSize"
            type="number"
            value={settings.chunkSize}
            onChange={(e) =>
              onSettingsChange({
                chunkSize: parseInt(e.target.value) || 1000,
              })
            }
            min={100}
            max={5000}
          />
          <span className="text-sm text-muted-foreground">characters</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Size of text chunks for embedding (recommended: 1000-2000)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chunkOverlap">Chunk Overlap</Label>
        <div className="flex items-center gap-2">
          <Input
            id="chunkOverlap"
            type="number"
            value={settings.chunkOverlap}
            onChange={(e) =>
              onSettingsChange({
                chunkOverlap: parseInt(e.target.value) || 200,
              })
            }
            min={0}
            max={1000}
          />
          <span className="text-sm text-muted-foreground">characters</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Overlap between chunks (recommended: 10-20% of chunk size)
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="processingMethod">Processing Method</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Processing Methods:</p>
                <ul className="text-xs mt-1 space-y-1">
                  {Object.entries(PROCESSING_METHOD_INFO).map(([key, info]) => (
                    <li key={key} className="mt-1">
                      <span className="font-medium">{info.title}:</span>{" "}
                      {info.description}
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          value={settings.processingMethod}
          onValueChange={(value) =>
            onSettingsChange({
              processingMethod: value as ProcessingMethod,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a processing method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Text Splitting</SelectItem>
            <SelectItem value="recursive">
              Recursive Character Splitting
            </SelectItem>
            <SelectItem value="markdown">Markdown Aware</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {PROCESSING_METHOD_INFO[settings.processingMethod]?.description}
        </p>
      </div>
    </div>
  );
}
