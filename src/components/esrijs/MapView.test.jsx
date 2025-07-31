import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import config from "../../config";
import MapView, { formatCountyId, getInitialExtent } from "./MapView";

describe("components/esrijs/MapView", () => {
  it("renders without crashing", () => {
    const div = document.createElement("div");
    const root = createRoot(div);
    root.render(<MapView />);
  });

  describe("getInitialExtent", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("returns zip first, then precinct, then county", async () => {
      const allParams = { zip: 84124, precinctID: "OPHIR", county: 29 };
      const fakePolygon = { polygon: true };
      global.fetch = vi
        .fn()
        .mockResolvedValue({
          json: () => Promise.resolve({ result: [{ geometry: fakePolygon }] }),
        });

      const extent = await getInitialExtent({
        zip: "84124",
        precinctID: "OPHIR",
        county: "29",
      });

      expect(extent).toEqual({ polygon: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(config.featureClassNames.ZIP),
      );

      allParams.zip = "";

      await getInitialExtent({ zip: "", precinctID: "OPHIR", county: "29" });

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(config.featureClassNames.VISTA_BALLOT_AREAS),
      );

      await getInitialExtent({ zip: "", precinctID: "", county: "29" });

      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining(config.featureClassNames.COUNTIES),
      );
    });

    it("does not make a request if non of the parameters are present", async () => {
      await getInitialExtent({ zip: "", precinctID: "", county: "" });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("formatCountyId", () => {
    it("pads numbers less than 10 with a leading zero", () => {
      expect(formatCountyId("29")).toEqual("29");
      expect(formatCountyId("9")).toEqual("09");
    });
  });
});
