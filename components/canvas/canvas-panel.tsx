"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { X, FileCode, Save } from "lucide-react";
import { CodeEditor } from "./code-editor"; // Assuming path is correct
import { MultiLanguagePreview } from "./multi-language-preview"; // Assuming path is correct
import { Badge } from "@/components/ui/badge";
import { FileExplorer } from "./file-explorer"; // Assuming path is correct

interface CanvasPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  language?: string;
  title?: string;
  files?: Record<string, { content: string; language: string }>;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string; // Full path for the node, useful for selection
  children?: FileNode[];
  content?: string; // Content might be redundant if fileContents is source of truth
  language?: string;
}

export const CanvasPanel = memo(function CanvasPanel({
  isOpen,
  onClose,
  initialCode = "",
  language = "jsx",
  title = "Canvas",
  files = {},
}: CanvasPanelProps) {
  const [activeFile, setActiveFile] = useState<string>("");
  const [fileContents, setFileContents] =
    useState<Record<string, { content: string; language: string }>>(files);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const buildFileTree = useCallback(
    (currentFiles: Record<string, { content: string; language: string }>) => {
      const root: FileNode[] = []; // Direct array instead of virtual root
      const folderMap: Record<string, FileNode> = {};

      // Sort paths to ensure proper hierarchy
      const sortedPaths = Object.keys(currentFiles).sort();

      for (const path of sortedPaths) {
        const { content, language: fileLang } = currentFiles[path];
        const parts = path.split("/");
        const fileName = parts[parts.length - 1];

        // Build folder structure
        let currentLevel = root;
        let currentPath = "";

        // Create folders for all parts except the last (which is the file)
        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          currentPath = currentPath
            ? `${currentPath}/${folderName}`
            : folderName;

          // Find or create folder at current level
          let folder = currentLevel.find(
            (node) => node.name === folderName && node.type === "folder"
          );
          if (!folder) {
            folder = {
              name: folderName,
              type: "folder",
              children: [],
              path: currentPath,
            };
            currentLevel.push(folder);
            folderMap[currentPath] = folder;
          }
          currentLevel = folder.children!;
        }

        // Add the file
        const fileNode: FileNode = {
          name: fileName,
          type: "file",
          content,
          language: fileLang,
          path,
        };
        currentLevel.push(fileNode);
      }

      setFileTree(root);
    },
    []
  );

  useEffect(() => {
    console.log("CanvasPanel useEffect triggered with files:", files);

    const currentFilesKeys = Object.keys(files || {});
    if (currentFilesKeys.length > 0) {
      console.log("CanvasPanel: Received files:", currentFilesKeys);
      setFileContents(files);

      const sortedFileKeys = [...currentFilesKeys].sort();
      let newActiveFile = "";
      if (files["app/page.tsx"]) {
        newActiveFile = "app/page.tsx";
      } else if (sortedFileKeys.length > 0) {
        newActiveFile = sortedFileKeys[0];
      }
      setActiveFile(newActiveFile);
      buildFileTree(files);
    } else if (initialCode) {
      const fileName = `main.${language}`;
      const newFileContents = {
        [fileName]: { content: initialCode, language },
      };
      setFileContents(newFileContents);
      setActiveFile(fileName);
      // Build tree for the single initial file
      buildFileTree(newFileContents);
    } else {
      // No files and no initial code
      setFileContents({});
      setActiveFile("");
      setFileTree([]);
    }
    // Reset these states when the main source `files` (or initial setup) changes
    setHasUnsavedChanges(false);
    setShowPreview(false);
  }, [files, initialCode, language, buildFileTree]);

  const handleFileSelect = useCallback(
    (fileNode: FileNode) => {
      if (fileNode.type === "file" && fileNode.path) {
        console.log("CanvasPanel: Selecting file:", {
          path: fileNode.path,
          contentAvailable: !!fileContents[fileNode.path],
          fileContents: fileContents,
          allFiles: Object.keys(fileContents),
        });
        setActiveFile(fileNode.path);
        setShowPreview(false);
      }
    },
    [fileContents]
  );

  const handleCodeChange = useCallback(
    (newCode: string) => {
      if (!activeFile) return;
      setFileContents((prev) => ({
        ...prev,
        [activeFile]: { ...prev[activeFile], content: newCode },
      }));
      setHasUnsavedChanges(true);
    },
    [activeFile] // Depends on activeFile
  );

  const handleSave = useCallback(() => {
    // In a real app, this would likely involve an API call or other persistence logic.
    // For this component, it just marks changes as saved.
    console.log(
      "CanvasPanel: Saving changes for:",
      activeFile,
      fileContents[activeFile]?.content
    );
    setHasUnsavedChanges(false);
    // Potentially trigger a re-render of preview if needed, though MultiLanguagePreview uses fileContents directly.
  }, [activeFile, fileContents]); // Include dependencies if save actually uses them beyond console.log

  const handlePreviewToggle = useCallback((show: boolean) => {
    setShowPreview(show);
  }, []); // setShowPreview is stable

  if (!isOpen) return null;

  const currentFile = activeFile ? fileContents[activeFile] : null;
  const fileCount = Object.keys(fileContents || {}).length;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            <span className="font-medium text-sm">{title}</span>
            {fileCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {fileCount} {fileCount === 1 ? "file" : "files"}
              </Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button variant="default" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            <FileExplorer
              files={fileTree}
              onFileSelect={handleFileSelect}
              selectedFilePath={activeFile}
            />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={showPreview ? 40 : 80} minSize={30}>
            <div className="h-full flex flex-col">
              {currentFile ? (
                <CodeEditor
                  code={currentFile.content}
                  onChange={handleCodeChange}
                  language={currentFile.language}
                  fileName={activeFile} // activeFile is the full path
                  hasResult={true} // Assuming CodeEditor uses this to show preview toggle
                  onSave={handleSave}
                  onPreviewToggle={handlePreviewToggle}
                  showPreview={showPreview}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No File Selected</p>
                    <p className="text-sm">
                      Select a file from the explorer to start editing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          {showPreview && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={25}>
                <MultiLanguagePreview
                  fileSystem={fileContents || {}}
                  activeFile={activeFile}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
});
