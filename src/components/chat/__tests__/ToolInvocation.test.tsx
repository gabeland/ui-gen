import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocation } from "../ToolInvocation";

afterEach(() => {
  cleanup();
});

describe("ToolInvocation", () => {
  describe("str_replace_editor tool", () => {
    it("displays 'Creating' message for create command", () => {
      render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="call"
        />
      );

      expect(screen.getByText("Creating /App.jsx")).toBeDefined();
    });

    it("displays 'Editing' message for str_replace command", () => {
      render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "str_replace", path: "/components/Button.jsx" }}
          state="call"
        />
      );

      expect(
        screen.getByText("Editing /components/Button.jsx")
      ).toBeDefined();
    });

    it("displays 'Updating' message for insert command", () => {
      render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "insert", path: "/utils/helpers.ts" }}
          state="call"
        />
      );

      expect(
        screen.getByText("Updating /utils/helpers.ts")
      ).toBeDefined();
    });

    it("displays 'Viewing' message for view command", () => {
      render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "view", path: "/config.json" }}
          state="call"
        />
      );

      expect(screen.getByText("Viewing /config.json")).toBeDefined();
    });

    it("displays generic message for unknown command", () => {
      render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "unknown", path: "/file.txt" }}
          state="call"
        />
      );

      expect(screen.getByText("Modifying /file.txt")).toBeDefined();
    });

    it("displays 'Editing file' when path is missing", () => {
      render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "str_replace" }}
          state="call"
        />
      );

      expect(screen.getByText("Editing file")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    it("displays 'Renaming' message for rename command", () => {
      render(
        <ToolInvocation
          toolName="file_manager"
          args={{
            command: "rename",
            path: "/old.jsx",
            new_path: "/new.jsx",
          }}
          state="call"
        />
      );

      expect(
        screen.getByText("Renaming /old.jsx to /new.jsx")
      ).toBeDefined();
    });

    it("displays 'Deleting' message for delete command", () => {
      render(
        <ToolInvocation
          toolName="file_manager"
          args={{ command: "delete", path: "/temp.jsx" }}
          state="call"
        />
      );

      expect(screen.getByText("Deleting /temp.jsx")).toBeDefined();
    });

    it("displays generic message for unknown file_manager command", () => {
      render(
        <ToolInvocation
          toolName="file_manager"
          args={{ command: "unknown", path: "/file.txt" }}
          state="call"
        />
      );

      expect(screen.getByText("Managing /file.txt")).toBeDefined();
    });
  });

  describe("unknown tools", () => {
    it("displays formatted tool name for unknown tool", () => {
      render(<ToolInvocation toolName="some_unknown_tool" state="call" />);

      expect(screen.getByText("some unknown tool")).toBeDefined();
    });
  });

  describe("loading and completion states", () => {
    it("shows loading spinner when state is not 'result'", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="call"
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });

    it("shows loading spinner when result is missing", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="result"
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });

    it("shows completion indicator when state is 'result' and result exists", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="result"
          result={{ success: true }}
        />
      );

      const completionDot = container.querySelector(".bg-emerald-500");
      expect(completionDot).toBeDefined();

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeNull();
    });

    it("applies loading styles when not complete", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="call"
        />
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain("bg-blue-50");
      expect(element.className).toContain("border-blue-200");
      expect(element.className).toContain("text-blue-700");
    });

    it("applies completion styles when complete", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="result"
          result={{ success: true }}
        />
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain("bg-emerald-50");
      expect(element.className).toContain("border-emerald-200");
      expect(element.className).toContain("text-emerald-700");
    });
  });

  describe("styling", () => {
    it("accepts and applies custom className", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          state="call"
          className="custom-class"
        />
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain("custom-class");
    });
  });
});
