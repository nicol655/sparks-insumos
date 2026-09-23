import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Gallery, gallerySources } from "@/components/product/gallery";
import { packshotSrcSet } from "@/components/catalog/packshot";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const product = catalogFor("es").find((item) => item.slug === "bharara-king")!;

describe("gallerySources", () => {
  it("always yields three slots, padding with the packshot", () => {
    expect(gallerySources(product)).toEqual([null, null, null]);
    expect(
      gallerySources({
        ...product,
        images: { ...product.images, packshot: "/a.webp", thumbnails: ["/b.webp"] },
      }),
    ).toEqual(["/b.webp", "/a.webp", "/a.webp"]);
  });
});

describe("packshotSrcSet", () => {
  it("declares 400/800/1200/1600 widths", () => {
    expect(packshotSrcSet("/king.webp")).toBe(
      "/king.webp 400w, /king.webp 800w, /king.webp 1200w, /king.webp 1600w",
    );
  });
});

describe("Gallery", () => {
  it("exposes the packshot with a descriptive name and three thumbs", () => {
    renderWithIntl(<Gallery product={product} />);

    const shots = screen.getAllByRole("img", { name: product.images.alt });
    expect(shots).toHaveLength(4);
    expect(product.images.alt.toLowerCase()).not.toContain("imagen de producto");
    expect(screen.getByRole("button", { name: "Vista 1 de King" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Vista 3 de King" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("selects another thumbnail", async () => {
    renderWithIntl(<Gallery product={product} />);

    await userEvent.click(screen.getByRole("button", { name: "Vista 2 de King" }));

    expect(screen.getByRole("button", { name: "Vista 2 de King" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Vista 1 de King" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Gallery product={product} />);

    await expectNoA11yViolations(container);
  });
});
