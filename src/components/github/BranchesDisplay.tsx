// components/github/BranchesDisplay.tsx

import { Select, Space, Spin, Tag } from 'antd';

import { GithubBranch } from '@/types/github';

const { Option } = Select;

interface BranchesDisplayProps {
  branches: GithubBranch[];
  loading: boolean;
  selectedRepo: string;
  selectedBranch?: string;
  onBranchChange?: (branchName: string) => void;
}

export const BranchesDisplay = ({ 
  branches, 
  loading, 
  selectedRepo,
  selectedBranch,
  onBranchChange 
}: BranchesDisplayProps) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">
        Branch
      </label>
      <Select
        placeholder={!selectedRepo ? "Select a repository first" : "Select a branch"}
        value={selectedBranch || undefined}
        onChange={onBranchChange}
        disabled={!selectedRepo}
        loading={loading}
        className="w-full"
        size="large"
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
        }
        notFoundContent={loading ? <Spin size="small" /> : 'No branches found'}
      >
        {branches.map((branch) => (
          <Option key={branch.name} value={branch.name}>
            <Space>
              <span>{branch.name}</span>
              {branch.protected && (
                <Tag color="blue" size="small" className="ml-1">Protected</Tag>
              )}
            </Space>
          </Option>
        ))}
      </Select>
    </div>
  );
};