/** Third-party analytics and ads should only run in a production build. */
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
