// components/github/RepoFileTree.tsx

import { useMemo, useState } from "react";
// GitHub-un öz saytında istifadə etdiyi rəsmi ikon paketi:
// npm install @primer/octicons-react
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
} from "@primer/octicons-react";
import { Image as ImageIcon, FileText as FileTextIcon, Check } from "lucide-react";

// Əgər layihənizdə "@/lib/utils" içində cn() varsa, aşağıdakı importu açın və
// yerli cn() funksiyasını silin:
// import { cn } from "@/lib/utils";
function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export interface RepoFileEntry {
  path: string;
  type: "file" | "dir" | string;
  size?: number;
  sha?: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  children?: TreeNode[];
}

interface RepoFileTreeProps {
  files: RepoFileEntry[];
  /** Hazırda ortada "preview" olunan tək fayl */
  selectedPath?: string;
  onSelectFile: (path: string) => void;
  /** AI-a göndərmək üçün seçilmiş (çox sayda ola bilən) fayllar */
  selectedFilePaths?: Set<string>;
  onToggleSelect?: (path: string) => void;
  className?: string;
}

// Flat fayl siyahısını ("src/App.tsx", "src/pages/show.tsx"...) nested tree-yə çevirir
function buildTree(files: RepoFileEntry[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split("/").filter(Boolean);
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = index === parts.length - 1;
      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          type: isLastPart && file.type === "file" ? "file" : "folder",
          size: isLastPart ? file.size : undefined,
          children: isLastPart && file.type === "file" ? undefined : [],
        };
        currentLevel.push(existingNode);
      }

      if (existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  // Qovluqlar əvvəl, fayllar sonra — hər ikisi əlifba sırası ilə
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => node.children && sortNodes(node.children));
  };
  sortNodes(root);

  return root;
}

// Uzantıya görə VS Code üslubunda rəngli badge-lər
const EXTENSION_BADGES: Record<string, { label: string; bg: string; color?: string }> = {
  ts: { label: "TS", bg: "#3178c6" },
  tsx: { label: "TSX", bg: "#3178c6" },
  js: { label: "JS", bg: "#f0db4f", color: "#1f1f1f" },
  jsx: { label: "JSX", bg: "#61dafb", color: "#1f1f1f" },
  mjs: { label: "JS", bg: "#f0db4f", color: "#1f1f1f" },
  json: { label: "{ }", bg: "#8bc34a", color: "#1f1f1f" },
  html: { label: "<>", bg: "#e34c26" },
  css: { label: "#", bg: "#2965f1" },
  scss: { label: "#", bg: "#cc6699" },
  py: { label: "PY", bg: "#3572a5" },
  java: { label: "J", bg: "#b07219" },
  go: { label: "GO", bg: "#00add8", color: "#1f1f1f" },
  rb: { label: "RB", bg: "#701516" },
  php: { label: "PHP", bg: "#4f5d95" },
  rs: { label: "RS", bg: "#dea584", color: "#1f1f1f" },
  c: { label: "C", bg: "#5c5c5c" },
  cpp: { label: "C++", bg: "#f34b7d" },
  cs: { label: "C#", bg: "#178600" },
  swift: { label: "SW", bg: "#f05138" },
  kt: { label: "KT", bg: "#a97bff" },
  yml: { label: "YML", bg: "#cb171e" },
  yaml: { label: "YML", bg: "#cb171e" },
  toml: { label: "TML", bg: "#9c4221" },
  sql: { label: "SQL", bg: "#e38c00", color: "#1f1f1f" },
  sh: { label: "SH", bg: "#89e051", color: "#1f1f1f" },
  vue: { label: "VUE", bg: "#41b883" },
  xml: { label: "XML", bg: "#e37933" },
  env: { label: "ENV", bg: "#8a8a8a" },
  lock: { label: "🔒", bg: "#8a8a8a" },
};

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp", "avif"]);

function FileTypeIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();

  if (lower === "readme.md" || lower === "readme") {
    return <FileTextIcon size={16} className="shrink-0 text-blue-400" />;
  }

  const ext = lower.includes(".") ? lower.split(".").pop()! : "";

  if (IMAGE_EXTENSIONS.has(ext)) {
    return (
      <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-[4px] bg-pink-500/15">
        <ImageIcon size={11} className="text-pink-500" strokeWidth={2.5} />
      </span>
    );
  }

  const badge = EXTENSION_BADGES[ext];
  if (badge) {
    return (
      <span
        className="shrink-0 flex items-center justify-center w-4 h-4 rounded-[4px] text-[8px] font-bold leading-none tracking-tighter"
        style={{ backgroundColor: badge.bg, color: badge.color ?? "#ffffff" }}
      >
        {badge.label}
      </span>
    );
  }

  return (
    <span className="shrink-0 text-muted-foreground/80 flex items-center">
      <FileIcon size={16} />
    </span>
  );
}

// AI-a göndərmək üçün faylı seç/sil edən checkbox.
// e.stopPropagation() + e.preventDefault() ikisi də var ki, klik heç bir
// halda yuxarıdakı row-un onClick-inə ötürülməsin VƏ əksinə - checkbox-a
// klikləmək faylı yanlışlıqla preview-a da açmasın.
function SelectCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle();
      }}
      aria-label={checked ? "Seçimi ləğv et" : "AI üçün seç"}
      className={cn(
        "shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-[3px] border transition-colors",
        checked
          ? "bg-primary border-primary"
          : "border-muted-foreground/40 hover:border-muted-foreground bg-transparent"
      )}
    >
      {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3.5} />}
    </button>
  );
}

function TreeItem({
  node,
  depth,
  selectedPath,
  onSelectFile,
  selectedFilePaths,
  onToggleSelect,
  expanded,
  toggleExpand,
}: {
  node: TreeNode;
  depth: number;
  selectedPath?: string;
  onSelectFile: (path: string) => void;
  selectedFilePaths?: Set<string>;
  onToggleSelect?: (path: string) => void;
  expanded: Set<string>;
  toggleExpand: (path: string) => void;
}) {
  const isFolder = node.type === "folder";
  const isOpen = expanded.has(node.path);
  const isPreviewed = selectedPath === node.path;
  const isChecked = !!selectedFilePaths?.has(node.path);

  // DİQQƏT: bu funksiya HƏR klikdə (checkbox-dan başqa) işə düşməlidir.
  // Konsoldan yoxlamaq üçün log qoyuldu - fayl adına kliklədikdə bu sətri
  // görmürsünüzsə, problem RepoFileTree-də deyil, klik ümumiyyətlə buraya
  // çatmır (məs. üstündə başqa bir görünməz element var) deməkdir.
  const handleRowClick = () => {
    console.log("🖱️ TreeItem klikləndi:", node.path, "isFolder:", isFolder);
    if (isFolder) {
      toggleExpand(node.path);
    } else {
      if (typeof onSelectFile !== "function") {
        console.error("⚠️ onSelectFile prop RepoFileTree-ə ötürülməyib!");
        return;
      }
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleRowClick}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        className={cn(
          "flex items-center gap-1.5 py-[3px] pr-2 text-[13px] leading-5 cursor-pointer select-none",
          "hover:bg-muted/60 transition-colors",
          isPreviewed && "bg-muted font-medium",
          isChecked && !isPreviewed && "bg-primary/[0.07]"
        )}
      >
        {isFolder ? (
          <>
            <span className="shrink-0 text-muted-foreground flex items-center">
              {isOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
            </span>
            <span className="shrink-0 flex items-center text-[#54aeff]">
              {isOpen ? <FileDirectoryOpenFillIcon size={16} /> : <FileDirectoryFillIcon size={16} />}
            </span>
          </>
        ) : (
          <>
            <span className="w-4" />
            {onToggleSelect && (
              <SelectCheckbox checked={isChecked} onToggle={() => onToggleSelect(node.path)} />
            )}
            <FileTypeIcon name={node.name} />
          </>
        )}
        {/* pointer-events-none: bu span heç vaxt öz klikini "udmasın",
            hər zaman valideyn div-in onClick-inə ötürsün */}
        <span className={cn("truncate pointer-events-none", isChecked && "text-primary")}>
          {node.name}
        </span>
      </div>

      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              selectedFilePaths={selectedFilePaths}
              onToggleSelect={onToggleSelect}
              expanded={expanded}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RepoFileTree({
  files,
  selectedPath,
  onSelectFile,
  selectedFilePaths,
  onToggleSelect,
  className,
}: RepoFileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files]);

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(tree.filter((n) => n.type === "folder").map((n) => n.path))
  );

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (!files.length) {
    return <div className="text-sm text-muted-foreground p-4 text-center">Fayl tapılmadı</div>;
  }

  return (
    <div className={cn("overflow-y-auto", className)}>
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          selectedFilePaths={selectedFilePaths}
          onToggleSelect={onToggleSelect}
          expanded={expanded}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
}