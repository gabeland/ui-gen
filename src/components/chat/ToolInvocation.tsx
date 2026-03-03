import { Loader2, FileEdit, FilePlus, Trash2, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolInvocationProps {
  toolName: string;
  args?: Record<string, any>;
  state?: "result" | "call" | "partial-call";
  result?: any;
  className?: string;
}

function getToolMessage(toolName: string, args?: Record<string, any>): {
  icon: React.ReactNode;
  message: string;
} {
  if (toolName === "str_replace_editor" && args) {
    const { command, path } = args;
    const fileName = path || "file";

    switch (command) {
      case "create":
        return {
          icon: <FilePlus className="w-3 h-3" />,
          message: `Creating ${fileName}`,
        };
      case "str_replace":
        return {
          icon: <FileEdit className="w-3 h-3" />,
          message: `Editing ${fileName}`,
        };
      case "insert":
        return {
          icon: <FileEdit className="w-3 h-3" />,
          message: `Updating ${fileName}`,
        };
      case "view":
        return {
          icon: <FolderTree className="w-3 h-3" />,
          message: `Viewing ${fileName}`,
        };
      default:
        return {
          icon: <FileEdit className="w-3 h-3" />,
          message: `Modifying ${fileName}`,
        };
    }
  }

  if (toolName === "file_manager" && args) {
    const { command, path, new_path } = args;
    const fileName = path || "files";

    switch (command) {
      case "rename":
        return {
          icon: <FileEdit className="w-3 h-3" />,
          message: `Renaming ${fileName} to ${new_path || "new name"}`,
        };
      case "delete":
        return {
          icon: <Trash2 className="w-3 h-3" />,
          message: `Deleting ${fileName}`,
        };
      default:
        return {
          icon: <FolderTree className="w-3 h-3" />,
          message: `Managing ${fileName}`,
        };
    }
  }

  // Fallback for unknown tools
  return {
    icon: <FolderTree className="w-3 h-3" />,
    message: toolName.replace(/_/g, " "),
  };
}

export function ToolInvocation({
  toolName,
  args,
  state,
  result,
  className,
}: ToolInvocationProps) {
  const { icon, message } = getToolMessage(toolName, args);
  const isComplete = state === "result" && result;
  const isLoading = !isComplete;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-xs border transition-colors",
        isComplete
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-blue-50 border-blue-200 text-blue-700",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      )}
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
