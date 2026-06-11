import { createHouseholdInvite, joinHouseholdWithInvite } from "@/lib/join";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { signUp: jest.fn() },
    rpc: jest.fn(),
  },
}));

const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

const params = {
  email: "sam@example.com",
  password: "supersecret",
  displayName: "Sam",
  code: "A1B2C3D4",
};

beforeEach(() => {
  mockSignUp.mockReset();
  mockRpc.mockReset();
});

describe("joinHouseholdWithInvite", () => {
  it("signs up then redeems the invite when a session is returned", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    mockRpc.mockResolvedValue({ data: "hh-1", error: null });

    const result = await joinHouseholdWithInvite(params);

    expect(result).toEqual({ error: null });
    expect(mockRpc).toHaveBeenCalledWith("redeem_household_invite", {
      p_code: "A1B2C3D4",
      p_display_name: "Sam",
    });
  });

  it("trims code and name before redeeming", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    mockRpc.mockResolvedValue({ data: "hh-1", error: null });

    await joinHouseholdWithInvite({ ...params, code: "  a1b2c3d4  ", displayName: "  Sam  " });

    expect(mockRpc).toHaveBeenCalledWith("redeem_household_invite", {
      p_code: "a1b2c3d4",
      p_display_name: "Sam",
    });
  });

  it("returns the auth error and skips redeem when sign-up fails", async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: { message: "Email already registered" } });

    const result = await joinHouseholdWithInvite(params);

    expect(result).toEqual({ error: "Email already registered" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("explains the confirmation case when no session is returned", async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null });

    const result = await joinHouseholdWithInvite(params);

    expect(result.error).toMatch(/confirm/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("surfaces a redeem RPC error (e.g. expired/invalid code)", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    mockRpc.mockResolvedValue({ data: null, error: { message: "invite has expired" } });

    const result = await joinHouseholdWithInvite(params);

    expect(result).toEqual({ error: "invite has expired" });
  });
});

describe("createHouseholdInvite", () => {
  it("returns the generated code", async () => {
    mockRpc.mockResolvedValue({ data: "A1B2C3D4", error: null });

    const result = await createHouseholdInvite();

    expect(result).toEqual({ code: "A1B2C3D4", error: null });
    expect(mockRpc).toHaveBeenCalledWith("create_household_invite");
  });

  it("surfaces an RPC error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "household already has two members" } });

    const result = await createHouseholdInvite();

    expect(result).toEqual({ code: null, error: "household already has two members" });
  });
});
