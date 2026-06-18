import { render, screen } from "@testing-library/react-native";

import { DayCard } from "../day-card";

describe("DayCard", () => {
  it("renders the reading label and intercourse count", () => {
    render(
      <DayCard card={{ chartDate: "2024-06-10", reading: "peak", intercourseCount: 2, isToday: false }} />,
    );
    expect(screen.getByText("Peak")).toBeTruthy();
    expect(screen.getByTestId("day-card-intercourse-2024-06-10")).toBeTruthy();
  });

  it("shows a dash when no reading and hides a zero count", () => {
    render(
      <DayCard card={{ chartDate: "2024-06-09", reading: null, intercourseCount: 0, isToday: false }} />,
    );
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.queryByTestId("day-card-intercourse-2024-06-09")).toBeNull();
  });

  it("flags today", () => {
    render(
      <DayCard card={{ chartDate: "2024-06-10", reading: null, intercourseCount: 0, isToday: true }} />,
    );
    expect(screen.getByText("Today")).toBeTruthy();
  });
});
