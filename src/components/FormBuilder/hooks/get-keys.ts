const getKeys = <T extends object>(
  values: T
): Record<keyof typeof values, string> => {
  // @ts-expect-error we are generating the types
  const paths: Record<keyof typeof values, string> = Object.fromEntries(
    Object.keys(values).map((key) => [key, key])
  );
  return paths;
};

export default getKeys;
