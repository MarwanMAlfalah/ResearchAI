import type { ReactNode } from "react";

import StatusPanel from "./StatusPanel";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ title, description, action, className }: EmptyStateProps): JSX.Element {
  return (
    <StatusPanel tone="empty" title={title} className={className}>
      <p>{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </StatusPanel>
  );
}
