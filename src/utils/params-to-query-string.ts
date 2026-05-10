export const paramsToQueryString = (params: {
  [key: string]: unknown;
}): string => {
  return Object.keys(params)
    .map((key) =>
      typeof params[key] === "object"
        ? `${key}=${JSON.stringify(params[key])}`
        : `${key}=${params[key]}`
    )
    .join("&");
};
