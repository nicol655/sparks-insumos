# Business Model

Source of the live store, read on 2026-09-23:
[sparksinsumos.com](https://sparksinsumos.com/) (Tiendanube, store `003/241/961`).

Source of internal operation, read on 2026-09-28:
[backoffice](https://claude.ai/artifact/NtzZJG94zfZrj3LpMvAtS9).
It is the **only** source of design for the backoffice. The rows of examples
(customers, orders `SP-…`, coupons, sales series, CBU) are filled in from the
mockup. They are not real customers, codes, or a real bank account.

`web/` replaces Tiendanube. `backoffice/` is the tool with which the team operates that store.

## Value proposition

Sparks Mayorista sells **beauty supplies to wholesale buyers** (arabic perfumes and inspiration, makeup, skincare and accessories) to beauty retailers and stores across Argentina, with a purchase floor, volume discount, member price, and national shipping.

Home page live quote: "Beauty and style at the best price". Who We Are:
"Beauty supplies that enhance your business".

The team does not operate in Tiendanube's admin. They operate in the backoffice:
orders, stock, customers, coupons, form messages, site text, and purchase rules.

## Customer segments

- **Buyer (B2B):** beauty retailers and stores across all of Argentina.
  Who We Are: "Three years ago we worked with beauty retailers and stores across all of Argentina."
- **Member (Sparks Club):** has a permanent 5% discount, exclusive sales, and welcome coupon. In the backoffice, the level is called Club.
- **Guest:** does not have that 5%. Can buy. Not a member.
- **End-user:** who uses or sells the product. The makeup from the live store is sent in **various shades**.
- **Team:** operators of the backoffice. Not customers. Three roles:
  Administration, Logistics, Content.

## Problem / jobs-to-be-done

Buyer:

- Restock beauty supplies without having to go to a physical majorist.
- Place an order that arrives anywhere in the province, paying shipping on request.
- Buy above the purchase floor and access volume discount, and if a member, the permanent 5% discount.
- Check stock, shades, and the order by WhatsApp when the catalog does not suffice.

Team:

- View sales, pending payment orders, low stock, and unanswered messages.
- Take a pending payment order to delivered, with tracking.
- Publish or correct a reference (price, stock, text in Spanish and English, pyramid, photos).
- Add a customer, upgrade them to Club, or block the account.
- Create a coupon, respond to the form, and publish the cover.

## Solution & key features

### Live Store

Four families on sparksinsumos.com: perfumes (arabic, inspiration, sets), makeup, skincare and body care, accessories. Pickup at **Franklin**.
Shipping by Correo Argentino and Via Cargo, at the buyer's expense. WhatsApp
`5491168692694`. Social media `@sparks.insumos`.

`web/` cuts the storefront to **perfumeria** and closes the order via WhatsApp until there are payment adjustments in the API.

### Backoffice

Navigation of design (three groups):

| Group | Sections |
|-------|-----------|
| Operation | Summary, Orders, Catalog, Messages |
| Customers | Users (customers and team), Coupons |
| Site | Content, Adjustments |

**Summary.** Sales for the period (7 / 14 / 30 days), orders, average ticket, club members. Recent orders, low stock, unanswered messages. Global search of orders, products, and customers.

**Orders.** Statuses: pending payment, preparing, shipped, delivered, canceled. Payment methods: credit card, transfer, or cash on pickup. Shipped and delivered have tracking. Export to CSV. The operator changes status and tracking; the design builds a WhatsApp message for the customer.

**Catalog** (the one from the design, not the four families of Tiendanube):

| Axis | Values |
|-----|---------|
| Category | Perfume, Set, Body splash |
| Family | Amber & spices, Floral, Gourmand, Woods, Fresh & aquatic |
| For | Woman, Man, Unisex |
| Stock | Units. **Low** = 1 to 3. **Out of stock** = 0 |
| Visibility | Published or draft |
| Text | Description in Spanish and English. Without English, the site in English shows the Spanish |
| Pyramid | Output, heart, background |
| Photos | Front packshot, atomizer, notes, lifestyle |

**Users.** Customers: name, last name, email, phone, level (Club or Guest), status (active or blocked), internal notes. The team is invited separately. Deleting a customer also deletes the history, level, and coupons.

**Coupons.** Code, percentage or fixed amount in ARS, usage limit (0 = no limit), expiration date, for members only or all, active or paused.
The codes drawn on the mockup are not published.

**Messages.** Inbox of the form. Unanswered or answered. Respond via panel or WhatsApp.

**Content.** Banner ad, cover and Sparks Club block, in Spanish and English. Home highlights: **maximum 4**, only published.

**Adjustments** (defaults from the design, 2026-09-28):

| Field | Default |
|-------|---------|
| Name | Sparks Parfums |
| Email | `hola@sparksparfums.com` |
| WhatsApp | `+54 9 11 6869 2694` |
| Pickup | Franklin, CABA · pickup with appointment |
| Minimum purchase | $30.000 |
| Delivery | 24/48 hours business days |
| Transporters | Correo Argentino · transport to quote |
| Level 1 | 5% from $100.000 |
| Level 2 | 10% from $300.000 |
| Member | **Permanent 5% discount** |
| Payments | Credit card up to 3 interest-free installments, transfer, cash on pickup. All three are enabled |
| Languages | Spanish published (default) and English published |
| Currency | ARS |

The CBU shown in the mockup is placeholder. It is not an account to be published.

### Roles

| Section | Administration | Logistics | Content |
|---------|----------------|-----------|-----------|
| Orders | Total | Total | — |
| Catalog and stock | Total | Only stock | Texts and images |
| Users | Total | Read-only | — |
| Coupons | Total | — | — |
| Content | Total | — | Total |
| Adjustments | Total | — | — |

A store account is not an operator.

## Revenue model & pricing

Sale of merchandise in **ARS**. No subscription.

| Rule | Amount | Where it is written |
|-------|--------|--------------------|
| Minimum purchase, no shipping | **$30.000** | Live cart and backoffice adjustments |
| Minimum in Who We Are | $50.000 | Outdated live page. Does not apply |
| 5% automatic | from $100.000 | Live bar and adjustments |
| 10% automatic | from $300.000 | Live bar and adjustments |
| Club member | **Permanent 5% discount** | Backoffice adjustments |
| Coupon | % or fixed amount, with limit, expiration date, and scope | Created by the team. No live codes |

The design does not state whether a coupon adds to the 5/10% or the 5% of member. Until there is such a rule,
**no accumulation**.

Payment methods enabled in the design: credit card (up to 3 interest-free installments), transfer, and cash on pickup. Turning off one in Adjustments removes it from the checkout. There is no payment gateway implemented: the storefront continues closing via WhatsApp.

List prices in the live store (as of 2026-09-23): miniatures ~$6.800; EDP 100 ml ~$24.000–$48.000; sets 4–5 pcs ~$34.000.

## Key metrics (North Star + supporting)

The store does not publish KPIs. The backoffice summary fixes which the team monitors. The numbers in the mockup (bars, «▲ 3,9%», «2 ups») are not measurements.

- **North Star:** sales for the period (total value of orders not canceled).
- **Supporting:** number of orders, average ticket, club members,
  pending payment orders, references with stock ≤ 3, unanswered messages.

## Market & competition

Today: Tiendanube + WhatsApp + social media. Alternative buyer: Mercado
Libre and other perfume arabic, replica and supplies retailers. The web does not
name competitors. Declared difference: purchase floor, national shipping, mix of the live store,
Franklin showroom, service via WhatsApp.

## Constraints & compliance

Tax identity (footer vivo, 2026): **Sparks Insumos**, CUIT
**20-95827720-3**, tel `011 6869-2694`, address Franklin (CABA).
Tiendanube email: `sparksinsumos@gmail.com`. New system email (adjustments): `hola@sparksparfums.com`.

Consumer (Ley 24.240). Destinations already used, do not invent others:

- Defense: [national consumer protection form](https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario)
- Refund: [contact + cancellation](https://sparksinsumos.com/contacto/?order_cancellation_without_id=true)

If the SKU is inspiration or replica 1:1, the UI indicates it. Do not attribute
sales to the designer's house.

Cookies: the live store shows a consent banner.

## Go-to-market

- Live site: `sparksinsumos.com`, until `web/` replaces it.
- Social media: Instagram, Facebook and TikTok `@sparks.insumos`.
- WhatsApp for inquiries: the number in Adjustments. Today `5491168692694`.
- Newsletter on the live store.
- Showroom: Franklin, pickup with appointment.
- Positioning of the new storefront: Sparks Parfums, editorial, bilingual
  es-AR / en. The backoffice edits those texts.

## Risks & assumptions

- **Who We Are says $50.000.** Applies to the minimum cart and adjustments:
  **$30.000**.
- **"Since 2019"** (cover of the design) against **"three years ago"** in Who We Are. No unique founding year.
- **Accumulation.** Coupon, 5/10% by amount and 5% of member are all three in the design. It does not state if they accumulate. They do not accumulate until there is a rule.
- **Credit card.** Adjustments leaves it enabled (up to 3 installments). No payment gateway. The storefront does not accept credit card payments until those adjustments live in the API.
- **CBU of the mockup.** Placeholder. Do not publish it.
- **Via Cargo** still named in the live store. Default text in Adjustments says «Correo Argentino · transport to quote» and does not name Via Cargo. The field is editable.
- **Backoffice catalog** is perfumería (perfume, set, body splash). Makeup, skincare and accessories remain on the live store and do not have a screen in this design.
- **Rows of the mockup** are not planted as data.
- **Spec 010** allows any account from the store. The design already requires role. The spec for roles is still not written.

## Glossary link

Terms in `glossary.md`. Floor, discounts, payments, roles, stock and order statuses also in `constitution.md`.
