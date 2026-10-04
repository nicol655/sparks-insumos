// The route handler sometimes sees the catalog call without Authorization
// while the Zustand token is still set. A second header keeps the bearer
// on that hop. The API still receives only Authorization.
export const CATALOG_TOKEN_HEADER = "x-sparks-token";
