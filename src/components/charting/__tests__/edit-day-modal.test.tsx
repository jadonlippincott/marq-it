import { fireEvent, render, screen } from "@testing-library/react-native";

import { EditDayModal } from "../edit-day-modal";
import type { DayCard } from "@/lib/day-cards";

const card: DayCard = {
  chartDate: "2024-06-10",
  reading: "high",
  intercourseCount: 2,
  isToday: false,
};

function setup(overrides: Partial<React.ComponentProps<typeof EditDayModal>> = {}) {
  const handlers = {
    onSetReading: jest.fn(),
    onClearReading: jest.fn(),
    onIncrement: jest.fn(),
    onDecrement: jest.fn(),
    onClose: jest.fn(),
  };
  render(<EditDayModal card={card} {...handlers} {...overrides} />);
  return handlers;
}

describe("EditDayModal", () => {
  it("renders the reading options and current intercourse count", () => {
    setup();
    expect(screen.getByLabelText("Low")).toBeTruthy();
    expect(screen.getByLabelText("Peak")).toBeTruthy();
    expect(screen.getByTestId("intercourse-count")).toHaveTextContent("2");
  });

  it("fires onSetReading with the tapped reading", () => {
    const { onSetReading } = setup();
    fireEvent.press(screen.getByLabelText("Low"));
    expect(onSetReading).toHaveBeenCalledWith("low");
  });

  it("fires the intercourse stepper handlers", () => {
    const { onIncrement, onDecrement } = setup();
    fireEvent.press(screen.getByLabelText("Increase intercourse count"));
    fireEvent.press(screen.getByLabelText("Decrease intercourse count"));
    expect(onIncrement).toHaveBeenCalled();
    expect(onDecrement).toHaveBeenCalled();
  });

  it("clears the reading", () => {
    const { onClearReading } = setup();
    fireEvent.press(screen.getByLabelText("Clear reading"));
    expect(onClearReading).toHaveBeenCalled();
  });

  it("renders nothing interactive when there is no card (closed)", () => {
    setup({ card: null });
    expect(screen.queryByTestId("intercourse-count")).toBeNull();
  });
});
