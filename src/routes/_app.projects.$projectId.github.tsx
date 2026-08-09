// pages/GithubPage.tsx

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ConnectionBadge } from "@/components/common/Badges";
import { ListSkeleton } from "@/components/common/States";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { Space, Row, Col, Empty, Card } from 'antd';
import { ReloadOutlined, CheckOutlined } from '@ant-design/icons';
import { toast } from 'sonner';

import { useGithub } from '@/hooks/useGithub';
import { RepositorySelect } from '@/components/github/RepositorySelect';
import { BranchesDisplay } from '@/components/github/BranchesDisplay';

export default function GithubPage() {
  const { integrations } = useAppStore();
  const { user } = useAuth();
  const { projectId = "p-1" } = useParams();

  const {
    isConnected,
    repos,
    branches,
    isLoadingRepos,
    isLoadingBranches,
    selectedRepo,
    setSelectedRepo,
    fetchRepositories,
    selectedBranch,
    setSelectedBranch,
    fetchBranches,
    connectGithub,
  } = useGithub();

  const githubId = localStorage.getItem("devflow.github.id");

  // Fetch repos when connected
  useEffect(() => {
    if (isConnected && user && githubId) {
      fetchRepositories(githubId);
    }
  }, [isConnected, user]);

  const handleRepoSelect = (value: string) => {
    setSelectedRepo(value);
    console.log("Selected repository:", value);
    if (value) {
      fetchBranches(value, githubId || "");
    }
  };

  // Handle Refresh
  const handleRefresh = async () => {
    if (!githubId) {
      toast.error("GitHub ID not found");
      return;
    }
    toast.info("Refreshing repositories...");
    await fetchRepositories(githubId);
    
    // If repository is selected, refresh branches too
    if (selectedRepo) {
      await fetchBranches(selectedRepo, githubId);
    }
    toast.success("Refreshed successfully!");
  };

  // Handle Submit
  const handleSubmit = () => {
    if (!selectedRepo) {
      toast.error("Please select a repository");
      return;
    }
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }
    
    toast.success(`Submitted: ${selectedRepo} → ${selectedBranch}`);
    // You can add your submit logic here
    console.log("Submitting:", {
      repository: selectedRepo,
      branch: selectedBranch,
      projectId: projectId,
      userId: user?.uid
    });
  };

  const isConnectedCheck = integrations.githubConnected || isConnected;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader 
        title="GitHub" 
        description="Repositories connected to this workspace."
        badge={<ConnectionBadge label={isConnectedCheck ? "Connected" : "Not connected"} connected={isConnectedCheck} />}
        actions={
          !isConnectedCheck ? (
            <Button size="sm" onClick={() => connectGithub(projectId)}>
              Connect GitHub
            </Button>
          ) : undefined
        } 
      />
      
      {isConnectedCheck && (
        <Space direction="vertical" size="large" className="w-full">
          {/* Repository, Branch Selection and Buttons - All in One Row */}
          <Card className="surface">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              {/* Repository Select */}
              <div className="flex-1 min-w-[200px]">
                <RepositorySelect
                  repos={repos}
                  loading={isLoadingRepos}
                  value={selectedRepo}
                  onChange={handleRepoSelect}
                />
              </div>
              
              {/* Branch Select */}
              <div className="flex-1 min-w-[200px]">
                <BranchesDisplay
                  branches={branches}
                  loading={isLoadingBranches}
                  selectedRepo={selectedRepo}
                  selectedBranch={selectedBranch}
                  onBranchChange={setSelectedBranch}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 flex-shrink-0">
                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedRepo || !selectedBranch}
                  className="whitespace-nowrap"
                >
                  <CheckOutlined className="mr-2" />
                  Submit
                </Button>
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  disabled={isLoadingRepos || isLoadingBranches}
                  className="whitespace-nowrap"
                >
                  <ReloadOutlined className={`mr-2 ${(isLoadingRepos || isLoadingBranches) ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Selected Info */}
            {selectedRepo && selectedBranch && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <span className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{selectedRepo}</span>
                  <span className="mx-2">→</span>
                  <span className="font-medium text-foreground">{selectedBranch}</span>
                </span>
              </div>
            )}
          </Card>
        </Space>
      )}
    </div>
  );
}