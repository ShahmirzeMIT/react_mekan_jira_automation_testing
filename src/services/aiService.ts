import {
  analysisResponse,
  failingTests,
  generatedDiff,
  implementationPlan,
  passingTests,
  quickResponses,
} from "@/mock/aiResponses";
import type { CodeDiff, TestResult } from "@/types";
import { delay } from "@/utils";

export const aiService = {
  async analyzeTask(taskKey: string): Promise<{ content: string; plan: string[] }> {
    await delay(1200);
    return {
      content: analysisResponse.replace("DEV-142", taskKey),
      plan: implementationPlan,
    };
  },
  async generateImplementationPlan(): Promise<string[]> {
    await delay(900);
    return implementationPlan;
  },
  async generateCode(): Promise<CodeDiff[]> {
    await delay(1600);
    return generatedDiff;
  },
  async reviewCode(): Promise<string> {
    await delay(1100);
    return quickResponses["Review Code"]!;
  },
  async findBugs(): Promise<string> {
    await delay(1000);
    return quickResponses["Find Bugs"]!;
  },
  async generateTests(): Promise<string> {
    await delay(1000);
    return quickResponses["Generate Tests"]!;
  },
  async explainCode(): Promise<string> {
    await delay(800);
    return quickResponses["Explain Code"]!;
  },
  async optimizeCode(): Promise<string> {
    await delay(900);
    return quickResponses["Optimize Code"]!;
  },
  async fixTestFailure(): Promise<string> {
    await delay(1300);
    return `The failing assertion compares the local task state before the Jira transition resolves. Await \`syncTask()\` inside \`completeTask()\` and re-read the issue before asserting, then the expected \`Done\` status is observed.`;
  },
  async runTests(shouldFail = false): Promise<TestResult[]> {
    await delay(1500);
    return shouldFail ? failingTests : passingTests;
  },
  async chat(prompt: string): Promise<string> {
    await delay(1100);
    const match = Object.keys(quickResponses).find((k) => prompt.toLowerCase().includes(k.toLowerCase()));
    if (match) return quickResponses[match]!;
    return `Looking at the current task context and the ${2} related files, here is what I would do:

1. Keep the transport concerns inside the service layer.
2. Surface every failure path in the UI with a retry affordance.
3. Add a regression test for the state you just described.

Ask me to **Generate Code** and I will produce the diff.`;
  },
};