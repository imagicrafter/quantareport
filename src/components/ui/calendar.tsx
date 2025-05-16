import * as React from "react"

export type CalendarProps = React.HTMLAttributes<HTMLDivElement> & {
  mode?: string;
  selected?: Date | Date[] | undefined;
  onSelect?: (date?: Date | Date[]) => void;
  defaultMonth?: Date;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
}

function Calendar({
  className,
  mode = "single",
  selected,
  onSelect,
  ...props
}: CalendarProps) {
  return (
    <div className={className}>
      <p>Calendar functionality has been removed</p>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
