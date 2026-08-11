// components/ai-workspace/AIResultDrawer.tsx
import { Drawer, Collapse, Tag, Alert, Empty } from "antd";
import { FileCode2, FileCheck2, AlertTriangle } from "lucide-react";
import { GeminiTaskResult } from "@/types/gemini";
import { CodeBlock } from "./CodeBlock";

interface AIResultDrawerProps {
  open: boolean;
  onClose: () => void;
  result: GeminiTaskResult | null;
  rawFallback?: string | null;
}

export function AIResultDrawer({ open, onClose, result, rawFallback }: AIResultDrawerProps) {
  return (
    <Drawer
      title={result ? result.task : "AI Response"}
      open={open}
      onClose={onClose}
      width="min(760px, 100vw)"
      destroyOnClose
    >
      {!result ? (
        rawFallback ? (
          // JSON parse alınmadı - heç olmasa xam cavabı göstərək ki, itməsin.
          <div className="space-y-2">
            <Alert
              type="warning"
              showIcon
              message="AI cavabı gözlənilən JSON formatında deyil"
              description="Xam cavab aşağıda göstərilir."
            />
            <CodeBlock code={rawFallback} />
          </div>
        ) : (
          <Empty description="Nəticə yoxdur" />
        )
      ) : (
        <div className="space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag color={result.status === "success" ? "green" : "orange"}>
              {result.status === "success" ? "Success" : "Needs more information"}
            </Tag>
            {result.language && <Tag color="blue">{result.language}</Tag>}
            {result.framework && <Tag color="purple">{result.framework}</Tag>}
          </div>

          {/* Summary - text hissə, kod hissəsindən ayrı */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm leading-relaxed text-foreground">{result.summary}</p>
          </div>

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<AlertTriangle className="size-4" />}
              message="Warnings"
              description={
                <ul className="list-disc pl-4 text-xs space-y-0.5">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              }
            />
          )}

          {/* needs_more_information halında fayl göstərmirik, izah kifayətdir */}
          {result.status === "needs_more_information" ? null : (
            <>
              {/* Dəyişən fayllar */}
              {result.files?.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileCode2 className="size-3.5" />
                    Changed files ({result.files.length})
                  </h3>
                  <Collapse
                    bordered={false}
                    defaultActiveKey={result.files.length === 1 ? [result.files[0].path] : []}
                    className="bg-transparent"
                  >
                    {result.files.map((file) => (
                      <Collapse.Panel
                        key={file.path}
                        header={
                          <span className="font-mono text-xs">{file.path}</span>
                        }
                      >
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">{file.reason}</p>
                          {file.changes?.length > 0 && (
                            <ul className="list-disc pl-4 text-xs space-y-0.5">
                              {file.changes.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          )}
                          <CodeBlock path={file.path} code={file.content} />
                        </div>
                      </Collapse.Panel>
                    ))}
                  </Collapse>
                </div>
              )}

              {/* Dəyişməyən fayllar */}
              {result.unchangedFiles?.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <FileCheck2 className="size-3.5" />
                    Unchanged files ({result.unchangedFiles.length})
                  </h3>
                  <Collapse bordered={false} className="bg-transparent">
                    {result.unchangedFiles.map((file) => (
                      <Collapse.Panel key={file.path} header={<span className="font-mono text-xs">{file.path}</span>}>
                        <p className="text-xs text-muted-foreground">{file.reason}</p>
                      </Collapse.Panel>
                    ))}
                  </Collapse>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}