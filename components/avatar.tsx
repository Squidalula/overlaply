interface AvatarProps {
  nickname: string;
  avatarUrl?: string | null;
  avatarColor: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export function Avatar({
  nickname,
  avatarUrl,
  avatarColor,
  size = "md",
}: AvatarProps) {
  const classes = sizeClasses[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={nickname}
        className={`${classes} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${classes} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: avatarColor }}
    >
      {nickname[0].toUpperCase()}
    </div>
  );
}
