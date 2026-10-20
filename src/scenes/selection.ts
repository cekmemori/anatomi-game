import { SystemId } from "../data/organs";

export type Selection =
  | { kind: "organ"; id: string }
  | {
      kind: "mesh";
      id: string;
      name: string;
      description?: string;
      wiki?: string;
      group: "bone" | "muscle";
      system: SystemId;
    };
