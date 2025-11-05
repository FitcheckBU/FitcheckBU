import { IonApp, setupIonicReact } from "@ionic/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "history";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "react-router-dom";
import { UserProvider } from "../context/UserContext";
import EmailAuthPage from "./EmailAuthPage";

const mockFindUserProfileByEmail = vi.fn();
const mockCreateUser = vi.fn();
const mockCreateBuyerProfile = vi.fn();
const mockCreateSellerProfile = vi.fn();
const mockCreateStore = vi.fn();

vi.mock("../lib/userService", () => ({
  findUserProfileByEmail: (...args: unknown[]) =>
    mockFindUserProfileByEmail(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  createBuyerProfile: (...args: unknown[]) => mockCreateBuyerProfile(...args),
  createSellerProfile: (...args: unknown[]) => mockCreateSellerProfile(...args),
  createStore: (...args: unknown[]) => mockCreateStore(...args),
}));

beforeAll(() => {
  setupIonicReact();
});

beforeEach(() => {
  mockFindUserProfileByEmail.mockReset();
  mockCreateUser.mockReset();
  mockCreateBuyerProfile.mockReset();
  mockCreateSellerProfile.mockReset();
  mockCreateStore.mockReset();
  window.localStorage.clear();
});

const renderPage = () => {
  const history = createMemoryHistory();
  const utils = render(
    <IonApp>
      <UserProvider>
        <Router history={history}>
          <EmailAuthPage />
        </Router>
      </UserProvider>
    </IonApp>,
  );
  return { history, ...utils };
};

const setIonInputValue = async (element: HTMLElement, value: string) => {
  await act(async () => {
    const event = new CustomEvent<{ value: string }>("ionChange", {
      detail: { value },
      bubbles: true,
    });
    element.dispatchEvent(event);
  });
};

const findIonInputByLabel = (pattern: RegExp) => {
  const matches = screen.getAllByLabelText(pattern);
  const host = matches.find((element) => element.tagName === "ION-INPUT");
  return (host ?? matches[0]) as HTMLElement;
};

describe("EmailAuthPage", () => {
  it("prompts for registration when the email is not found", async () => {
    mockFindUserProfileByEmail.mockResolvedValue(null);

    renderPage();

    const emailInput = findIonInputByLabel(/email/i);
    await setIonInputValue(emailInput, "newuser@example.com");

    const continueButton = screen.getByText(/continue/i);
    await userEvent.click(continueButton);

    await waitFor(() =>
      expect(mockFindUserProfileByEmail).toHaveBeenCalledWith(
        "newuser@example.com",
      ),
    );

    expect(screen.getByTestId("registration-form")).toBeInTheDocument();
  });

  it("registers a new seller and redirects home", async () => {
    mockFindUserProfileByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue({
      id: "seller123",
      email: "seller@example.com",
      name: "Seller Sam",
      age: 33,
      user_type: "seller",
    });
    const fakeStoreRef = { id: "store123" };
    mockCreateStore.mockResolvedValue(fakeStoreRef);

    const { history } = renderPage();

    const emailInput = findIonInputByLabel(/email/i);
    await setIonInputValue(emailInput, "seller@example.com");

    await userEvent.click(screen.getByText(/continue/i));

    const nameInput = findIonInputByLabel(/full name/i);
    await setIonInputValue(nameInput, "Seller Sam");
    const ageInput = findIonInputByLabel(/age/i);
    await setIonInputValue(ageInput, "33");

    const sellerOption = screen.getByLabelText(/seller/i);
    await userEvent.click(sellerOption);

    const storeLocationInput = findIonInputByLabel(/store location/i);
    await setIonInputValue(storeLocationInput, "Boston, MA");

    await userEvent.click(screen.getByText(/register/i));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalled();
      expect(mockCreateStore).toHaveBeenCalledWith("Boston, MA");
      expect(mockCreateSellerProfile).toHaveBeenCalledWith(
        "seller123",
        fakeStoreRef,
      );
    });

    expect(history.location.pathname).toBe("/home");
  });
});
