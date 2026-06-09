import { fireEvent, render, screen } from "@testing-library/react-native";

import { ACTIONS, ActionButtons } from "../action-buttons";

describe("ActionButtons", () => {
  it("renders all four Home actions", () => {
    render(<ActionButtons />);
    for (const action of ACTIONS) {
      expect(screen.getByText(action)).toBeTruthy();
    }
  });

  it("fires onPress with the tapped action", () => {
    const onPress = jest.fn();
    render(<ActionButtons onPress={onPress} />);
    fireEvent.press(screen.getByText("Peak"));
    expect(onPress).toHaveBeenCalledWith("Peak");
  });
});
