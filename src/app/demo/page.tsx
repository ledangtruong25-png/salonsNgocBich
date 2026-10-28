import { Workspace } from '@/components/workspace';
import fixture from '@/lib/demo.json';
import type { WorkspaceData } from '@/lib/types';
export default function DemoPage() { return <Workspace data={fixture as WorkspaceData} mode="demo"/>; }
