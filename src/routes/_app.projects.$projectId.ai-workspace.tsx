import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIStatusBadge } from "@/components/common/Badges";
import { useAppStore } from "@/store/appStore";
import { aiService } from "@/services/aiService";

export const Route = createFileRoute("/_app/projects/$projectId/ai-workspace")({
  head: () => ({
    meta: [
      { title: "AI workspace — DevFlow AI" },
      { name: "description", content: "Analyze tasks, generate code, review diffs and run simulated tests in the DevFlow AI development workspace." },
      { property: "og:title", content: "AI workspace — DevFlow AI" },
      { property: "og:description", content: "Analyze, generate, review and test code with AI." },
    ],
  }),
  component: AIWorkspacePage,
});

function AIWorkspacePage() {
  const { ai, setAIStatus, logActivity } = useAppStore();
  const [prompt, setPrompt] = useState("Implement the acceptance criteria for the selected task.");
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [code, setCode] = useState("// Generated code will appear here\n");
  const [tests, setTests] = useState<string | null>(null);
  const taskKey = ai.selectedTaskKey ?? "DEV-142";

  async function analyze() {
    setAIStatus("analyzing");
    const res = await aiService.analyzeTask(taskKey, ai.selectedFiles);
    setAnalysis(res.steps);
    setAIStatus("idle");
    logActivity("ai", `AI analyzed ${taskKey}`, { taskKey });
    toast.success("AI analysis complete.");
  }

  async function generate() {
    setAIStatus("generating");
    const res = await aiService.generateCode(taskKey, prompt);
    setCode(res.code);
    setAIStatus("idle");
    logActivity("ai", `AI generated code for ${taskKey}`, { taskKey });
    toast.success("Code generated.");
  }

  async function runTests() {
    setAIStatus("testing");
    const res = await aiService.runTests(taskKey);
    setTests(res.output);
    setAIStatus("idle");
    toast.success("All tests passed.");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="AI Workspace" description={`Task ${taskKey} · ${ai.selectedFiles.length} files in context`}
        badge={<AIStatusBadge status={ai.status} />}
        actions={<>
          <Button size="sm" variant="secondary" onClick={analyze}>Analyze</Button>
          <Button size="sm" onClick={generate}>Generate Code</Button>
          <Button size="sm" variant="secondary" onClick={runTests}>Run Tests</Button>
        </>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
        <aside className="space-y-4">
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Context files</h2>
            <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
              {ai.selectedFiles.length ? ai.selectedFiles.map((f) => <li key={f}>{f}</li>) : <li>No files related yet.</li>}
            </ul>
          </section>
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Prompt</h2>
            <Textarea className="mt-2" rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </section>
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Analysis</h2>
            <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {analysis.length ? analysis.map((s) => <li key={s}>• {s}</li>) : <li>Run an analysis to see the AI plan.</li>}
            </ol>
          </section>
        </aside>

        <section className="surface overflow-hidden">
          <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground">generated-changes.ts</div>
          <Editor height="460px" theme="vs-dark" defaultLanguage="typescript" value={code} onChange={(v) => setCode(v ?? "")} options={{ minimap: { enabled: false }, fontSize: 13 }} />
          {tests && <pre className="max-h-48 overflow-auto border-t border-border p-4 font-mono text-xs text-muted-foreground">{tests}</pre>}
        </section>
      </div>
    </div>
  );
}
