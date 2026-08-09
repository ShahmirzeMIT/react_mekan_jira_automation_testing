// components/github/RepositorySelect.tsx

import { Select, Space, Spin, Tag } from 'antd';
import { 
  GithubOutlined, 
  LockOutlined, 
  UnlockOutlined,
  StarOutlined,
  ForkOutlined
} from '@ant-design/icons';
import { GithubRepo } from '@/types/github';

const { Option } = Select;

interface RepositorySelectProps {
  repos: GithubRepo[];
  loading: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RepositorySelect = ({ 
  repos, 
  loading, 
  value, 
  onChange,
  placeholder = 'Choose a repository...'
}: RepositorySelectProps) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">
        Repository
      </label>
      <Select
        placeholder={placeholder}
        value={value || undefined}
        onChange={onChange}
        loading={loading}
        className="w-full"
        size="large"
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
        }
        notFoundContent={loading ? <Spin size="small" /> : 'No repositories found'}
      >
        {repos.map((repo) => (
          <Option key={repo.id} value={repo.full_name}>
            <Space className="w-full justify-between">
              <Space>
                <GithubOutlined style={{ color: '#24292e' }} />
                <span className="font-medium">{repo.full_name}</span>
              </Space>
              <Space size="small">
                {repo.private ? (
                  <Tag 
                    icon={<LockOutlined />} 
                    color="orange"
                    className="flex items-center gap-1"
                  >
                    Private
                  </Tag>
                ) : (
                  <Tag 
                    icon={<UnlockOutlined />} 
                    color="green"
                    className="flex items-center gap-1"
                  >
                    Public
                  </Tag>
                )}
                {repo.language && (
                  <Tag color="blue" className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{
                      backgroundColor: getLanguageColor(repo.language)
                    }} />
                    {repo.language}
                  </Tag>
                )}
              </Space>
            </Space>
          </Option>
        ))}
      </Select>
    </div>
  );
};

// Language color mapping
const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'C++': '#f34b7d',
    'C#': '#178600',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Swift': '#ffac45',
    'Kotlin': '#A97BFF',
    'Vue': '#41b883',
    'React': '#61dafb',
    'Angular': '#dd0031',
    'Docker': '#2496ED',
    'Shell': '#89e051',
  };
  return colors[language] || '#8257e6';
};