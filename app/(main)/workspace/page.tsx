import { WorkspaceClient } from "@/components/workspaceClient";
import { getWorkspaceUser, getWorkspaceById } from "@/actions/workspace";
import HowToUse from "@/components/howToUse";

interface WorkspacePageProps {
  searchParams: Promise<{ prompt?: string; id?: string }>;
}

export default async function WorkspacePage({
  searchParams,
}: WorkspacePageProps) {
  const { prompt, id } = await searchParams;

  const user = await getWorkspaceUser();

  let workspace = null;
  if (id) {
    workspace = await getWorkspaceById(id, user.id);
  }

  return (<div>

    <HowToUse></HowToUse>
    <WorkspaceClient
      initialPrompt={prompt ?? null}
      workspace={workspace}
      userCredits={user.credits}
      userId={user.id}
      userPlan={user.plan}
      />
      </div>
  );
}