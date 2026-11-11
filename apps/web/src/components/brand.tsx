import { Video } from '@gravity-ui/icons';

/**
 * The app's logo and name. With `collapseOnMobile` the name is hidden visually
 * on phones (it stays for screen readers) to make room in a tight header.
 */
export function Brand({
  collapseOnMobile = false,
}: {
  collapseOnMobile?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30"
      >
        <Video className="size-6" />
      </span>
      <span
        className={`text-xl font-semibold tracking-tight ${collapseOnMobile ? 'max-sm:sr-only' : ''}`}
      >
        Video meetings
      </span>
    </div>
  );
}
