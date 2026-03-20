import { cn } from "@/utils/cn";

const SIZE = {
  sm: { box: "w-8 h-8 text-xs", ring: "ring-2" },
  md: { box: "w-9 h-9 text-sm", ring: "ring-2" },
  lg: { box: "w-12 h-12 text-base", ring: "ring-2" },
  xl: { box: "w-20 h-20 text-2xl", ring: "ring-4" },
};

export function UserAvatar({ user, size = "sm", shadow = false }) {
  const { box, ring } = SIZE[size] ?? SIZE.sm;

  const initials = (user?.name ?? user?.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const base = cn("rounded-full object-cover ring-white", box, ring, {
    "shadow-md": shadow,
  });

  if (user?.user_metadata?.avatar_url) {
    return (
      <img
        src={user.user_metadata.avatar_url}
        alt={user?.name ?? "Avatar korisnika"}
        className={base}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center font-bold bg-primary-100 text-primary-700",
        base,
      )}
    >
      {initials}
    </div>
  );
}
