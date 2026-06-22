import { fireEvent, render, screen } from "@testing-library/react-native";

import { CalendarHeader } from "../calendar-header";
import type { DayCard } from "@/lib/day-cards";

const cards: DayCard[] = [
  { chartDate: "2024-06-08", reading: null, intercourseCount: 0, isToday: false },
  { chartDate: "2024-06-09", reading: "high", intercourseCount: 0, isToday: false },
  { chartDate: "2024-06-10", reading: null, intercourseCount: 2, isToday: true },
];

describe("CalendarHeader", () => {
  it("renders a chip per card", () => {
    render(<CalendarHeader cards={cards} selectedDate="2024-06-10" onSelectDate={() => {}} />);
    expect(screen.getByTestId("calendar-chip-2024-06-08")).toBeTruthy();
    expect(screen.getByTestId("calendar-chip-2024-06-10")).toBeTruthy();
  });

  it("marks days with a reading or intercourse, but not empty days", () => {
    render(<CalendarHeader cards={cards} selectedDate="2024-06-10" onSelectDate={() => {}} />);
    expect(screen.getByTestId("calendar-marker-2024-06-09")).toBeTruthy(); // reading
    expect(screen.getByTestId("calendar-marker-2024-06-10")).toBeTruthy(); // intercourse
    expect(screen.queryByTestId("calendar-marker-2024-06-08")).toBeNull(); // empty
  });

  it("fires onSelectDate with the tapped date", () => {
    const onSelectDate = jest.fn();
    render(<CalendarHeader cards={cards} selectedDate="2024-06-10" onSelectDate={onSelectDate} />);
    fireEvent.press(screen.getByTestId("calendar-chip-2024-06-09"));
    expect(onSelectDate).toHaveBeenCalledWith("2024-06-09");
  });
});
