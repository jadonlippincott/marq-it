import { signIn } from "@/lib/signin";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: { auth: { signInWithPassword: jest.fn() } },
}));

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;

beforeEach(() => mockSignIn.mockReset());

describe("signIn", () => {
  it("returns no error on success and trims the email", async () => {
    mockSignIn.mockResolvedValue({ data: { session: {} }, error: null });

    const result = await signIn({ email: "  a@example.com  ", password: "pw" });

    expect(result).toEqual({ error: null });
    expect(mockSignIn).toHaveBeenCalledWith({ email: "a@example.com", password: "pw" });
  });

  it("surfaces invalid-credentials errors", async () => {
    mockSignIn.mockResolvedValue({ data: { session: null }, error: { message: "Invalid login credentials" } });

    const result = await signIn({ email: "a@example.com", password: "wrong" });

    expect(result).toEqual({ error: "Invalid login credentials" });
  });
});
