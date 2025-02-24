"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen, GraduationCap } from "lucide-react";

export interface TreeData {
  id: string;
  name: string;
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
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-10 w-full justify-start gap-2 rounded-none px-2 text-base font-normal hover:bg-muted",
          selectedId === item.id && "bg-muted font-medium",
          hasChildren && "font-medium",
        )}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          } else {
            onSelect?.(item.id);
          }
        }}
      >
        {hasChildren && (
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 transition-transform", {
              "rotate-90": isExpanded,
            })}
          />
        )}
        {hasChildren ? (
          <GraduationCap className="h-4 w-4 shrink-0" />
        ) : (
          <BookOpen className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{item.name}</span>
      </Button>
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
