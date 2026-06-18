import { render, screen } from "@testing-library/react-native";

import { PROTOCOL_META, ProtocolView } from "../protocol-view";

describe("PROTOCOL_META", () => {
  it("marks only Nursing Mother as supported", () => {
    expect(PROTOCOL_META.nursing_mother.supported).toBe(true);
    expect(PROTOCOL_META.transition_to_period.supported).toBe(false);
    expect(PROTOCOL_META.regular_cycle.supported).toBe(false);
  });
});

describe("ProtocolView routing", () => {
  it("renders the Nursing Mother chart for the nursing_mother protocol", () => {
    render(<ProtocolView protocol="nursing_mother" entries={[]} isEmpty />);
    expect(screen.getByTestId("nursing-mother-chart")).toBeTruthy();
    expect(screen.queryByTestId("protocol-unsupported")).toBeNull();
  });

  it("renders the unsupported stub for other protocols", () => {
    for (const protocol of ["transition_to_period", "regular_cycle"] as const) {
      const { unmount } = render(<ProtocolView protocol={protocol} entries={[]} isEmpty />);
      expect(screen.getByTestId("protocol-unsupported")).toBeTruthy();
      expect(screen.queryByTestId("nursing-mother-chart")).toBeNull();
      unmount();
    }
  });

  it("shows the day count once entries exist", () => {
    render(
      <ProtocolView
        protocol="nursing_mother"
        entries={[{ chartDate: "2024-06-10", reading: "peak" }]}
        isEmpty={false}
      />,
    );
    expect(screen.getByText("1 day charted.")).toBeTruthy();
  });
});
