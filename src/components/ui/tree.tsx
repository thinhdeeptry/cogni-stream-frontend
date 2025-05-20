"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { BookOpen, ChevronRight, Folder, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface TreeData {
  id: string;
  name: string;
  level?: number;
  children?: TreeData[];
}

export interface TreeProps {
  data: TreeData[];
  onSelect?: (id: string) => void;
  selectedId?: string;
}

export function Tree({ data, onSelect, selectedId }: TreeProps) {
  return (
    <div className="space-y-1">
      {data.map((item) => (
        <TreeItem
          key={item.id}
          item={item}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}

interface TreeItemProps {
  item: TreeData;
  onSelect?: (id: string) => void;
  selectedId?: string;
}

function TreeItem({ item, onSelect, selectedId }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div className="flex items-center">
        {hasChildren && (
          <button
            type="button"
            className="mr-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronRight
              className={cn("h-4 w-4 shrink-0 transition-transform", {
                "rotate-90": isExpanded,
              })}
            />
          </button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-10 w-full justify-start gap-2 rounded-none px-2 text-base font-normal hover:bg-muted",
            selectedId === item.id && "bg-muted font-medium",
            hasChildren && "font-medium",
          )}
          onClick={() => onSelect?.(item.id)}
        >
          {item.level === 0 && <GraduationCap className="h-4 w-4 shrink-0" />}
          {item.level === 1 && <Folder className="h-4 w-4 shrink-0" />}
          {item.level === 2 && <BookOpen className="h-4 w-4 shrink-0" />}
          <span className="truncate">{item.name}</span>
        </Button>
      </div>
      {isExpanded && item.children && (
        <div className="ml-4 border-l pl-2">
          <Tree
            data={item.children}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        </div>
      )}
    </div>
  );
}
