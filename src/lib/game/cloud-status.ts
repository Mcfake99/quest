import { create } from "zustand";

export type CloudStatus = "guest" | "loading" | "saving" | "saved" | "error";

type CloudStatusStore = {
  status: CloudStatus;
  setStatus: (status: CloudStatus) => void;
};

export const useCloudStatus = create<CloudStatusStore>((set) => ({
  status: "guest",
  setStatus: (status) => set({ status }),
}));
