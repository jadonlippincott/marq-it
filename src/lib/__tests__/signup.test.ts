import { signUpAndCreateHousehold } from "@/lib/signup";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { signUp: jest.fn() },
    rpc: jest.fn(),
  },
}));

const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

const params = { email: "a@example.com", password: "supersecret", displayName: "Jane", role: "wife" as const };

beforeEach(() => {
  mockSignUp.mockReset();
  mockRpc.mockReset();
});

describe("signUpAndCreateHousehold", () => {
  it("creates the household when sign-up returns a session", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    mockRpc.mockResolvedValue({ data: "hh-1", error: null });

    const result = await signUpAndCreateHousehold(params);

    expect(result).toEqual({ error: null });
    expect(mockRpc).toHaveBeenCalledWith("create_household_with_member", {
      p_display_name: "Jane",
      p_role: "wife",
    });
  });

  it("trims the display name before sending it to the RPC", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    mockRpc.mockResolvedValue({ data: "hh-1", error: null });

    await signUpAndCreateHousehold({ ...params, displayName: "  Jane  " });

    expect(mockRpc).toHaveBeenCalledWith("create_household_with_member", {
      p_display_name: "Jane",
      p_role: "wife",
    });
  });

  it("returns the auth error and skips the RPC when sign-up fails", async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: { message: "Email already registered" } });

    const result = await signUpAndCreateHousehold(params);

    expect(result).toEqual({ error: "Email already registered" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("explains the confirmation case when no session is returned", async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null });

    const result = await signUpAndCreateHousehold(params);

    expect(result.error).toMatch(/confirm/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("surfaces an RPC error", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    mockRpc.mockResolvedValue({ data: null, error: { message: "user already belongs to a household" } });

    const result = await signUpAndCreateHousehold(params);

    expect(result).toEqual({ error: "user already belongs to a household" });
  });
});
