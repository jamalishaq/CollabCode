import type { PresenceUser } from '@collabcode/shared-types';

interface PresenceBarProps {
  users: PresenceUser[];
}

export function PresenceBar({ users }: PresenceBarProps) {
  return (
    <div className="presence-bar">
      <strong>Presence:</strong>
      {users.length === 0 ? <span>No collaborators online</span> : null}
      {users.map((user) => (
        <span className="presence-pill" key={user.userId} style={{ borderColor: user.color }}>
          {user.displayName}
        </span>
      ))}
    </div>
  );
}
