export const PHOTO_STAGES = [
  {
    role: "front",
    title: "Front",
    helper: "Capture the entire front of the garment.",
  },
  {
    role: "back",
    title: "Back",
    helper: "Capture the entire back of the garment.",
  },
  {
    role: "label",
    title: "Label / Tag",
    helper: "Capture the size/material or brand label close-up.",
  },
] as const;

export type PhotoRole = (typeof PHOTO_STAGES)[number]["role"];

export const findStageByRole = (role?: string) =>
  PHOTO_STAGES.find((stage) => stage.role === role);
