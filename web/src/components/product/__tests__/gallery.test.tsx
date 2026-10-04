import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { packshotSrcSet } from "@/components/catalog/packshot";
import { Gallery, gallerySources } from "@/components/product/gallery";
import { catalogFor } from "@/fixtures/catalog";
import { expectNoA11yViolations } from "@/test/a11y";
import { renderWithIntl } from "@/test/i18n";

const product = catalogFor("es").find((item) => item.slug === "bharara-king")!;

const withPhotos = {
  ...product,
  images: {
    ...product.images,
    packshot: "/a.webp",
    thumbnails: ["/b.webp"],
    alt: "King bottle",
  },
};

function heroImage(): HTMLElement {
  const figure = screen.getByRole("figure");
  const hero = within(figure)
    .getAllByRole("img")
    .find((node) => !node.closest("ul"));

  if (!hero) throw new Error("hero image missing");
  return hero;
}

describe("gallerySources", () => {
  it("yields three slots and does not copy the packshot into the gaps", () => {
    expect(gallerySources(product)).toEqual([null, null, null]);
    expect(gallerySources(withPhotos)).toEqual(["/b.webp", null, null]);
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
  it("starts on the packshot and toggles a real thumbnail", async () => {
    renderWithIntl(<Gallery product={withPhotos} />);

    expect(heroImage()).toHaveAttribute("src", "/a.webp");
    expect(screen.getAllByRole("button")).toHaveLength(1);

    const thumb = screen.getByRole("button", { name: "Vista 1 de King" });
    expect(thumb).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(thumb);

    expect(thumb).toHaveAttribute("aria-pressed", "true");
    expect(heroImage()).toHaveAttribute("src", "/b.webp");

    await userEvent.click(thumb);

    expect(thumb).toHaveAttribute("aria-pressed", "false");
    expect(heroImage()).toHaveAttribute("src", "/a.webp");
  });

  it("does not make an empty slot a button", () => {
    renderWithIntl(<Gallery product={product} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: product.images.alt })).toHaveLength(4);
    expect(product.images.alt.toLowerCase()).not.toContain("imagen de producto");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Gallery product={withPhotos} />);

    await expectNoA11yViolations(container);
  });
});
