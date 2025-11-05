import { IonApp, setupIonicReact } from "@ionic/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "history";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "react-router-dom";
import TopNavBar from "./TopNavBar";

const mockSignOut = vi.fn();
const mockSetUser = vi.fn();

vi.mock("../context/UserContext", () => ({
  useUser: () => ({
    user: {
      id: "user123",
      email: "user@example.com",
      name: "Test User",
      age: 30,
      user_type: "buyer" as const,
    },
    signOut: mockSignOut,
    setUser: mockSetUser,
  }),
}));

beforeAll(() => {
  setupIonicReact();
});

beforeEach(() => {
  mockSignOut.mockReset();
  mockSetUser.mockReset();
});

describe("TopNavBar", () => {
  it("shows sign-out button and clears session when clicked", async () => {
    const history = createMemoryHistory({ initialEntries: ["/buyer"] });

    render(
      <IonApp>
        <Router history={history}>
          <TopNavBar isSidebarOpen={false} onMenuClick={vi.fn()} />
        </Router>
      </IonApp>,
    );

    const signOutButton = screen.getByText(/sign out/i);
    await userEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(history.location.pathname).toBe("/sign-in");
  });
});
