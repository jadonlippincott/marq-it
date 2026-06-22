import { render, screen } from "@testing-library/react-native";

import { PROTOCOL_META, ProtocolView } from "../protocol-view";

const baseProps = { today: "2024-06-10", entries: [], intercourseByDate: {} };

describe("PROTOCOL_META", () => {
  it("marks only Nursing Mother as supported", () => {
    expect(PROTOCOL_META.nursing_mother.supported).toBe(true);
    expect(PROTOCOL_META.transition_to_period.supported).toBe(false);
    expect(PROTOCOL_META.regular_cycle.supported).toBe(false);
  });
});

describe("ProtocolView routing", () => {
  it("renders the Nursing Mother chart for the nursing_mother protocol", () => {
    render(<ProtocolView protocol="nursing_mother" {...baseProps} isEmpty />);
    expect(screen.getByTestId("nursing-mother-chart")).toBeTruthy();
    expect(screen.queryByTestId("protocol-unsupported")).toBeNull();
  });

  it("renders the unsupported stub for other protocols", () => {
    for (const protocol of ["transition_to_period", "regular_cycle"] as const) {
      const { unmount } = render(<ProtocolView protocol={protocol} {...baseProps} isEmpty />);
      expect(screen.getByTestId("protocol-unsupported")).toBeTruthy();
      expect(screen.queryByTestId("nursing-mother-chart")).toBeNull();
      unmount();
    }
  });

  it("renders the calendar header and day-cards column once entries exist", () => {
    render(
      <ProtocolView
        protocol="nursing_mother"
        today="2024-06-10"
        entries={[{ chartDate: "2024-06-10", reading: "peak" }]}
        intercourseByDate={{ "2024-06-10": 1 }}
        isEmpty={false}
      />,
    );
    expect(screen.getByTestId("calendar-header")).toBeTruthy();
    expect(screen.getByTestId("day-cards-column")).toBeTruthy();
  });
});
