import { useCallback, useState } from "react";

import AutocompleteField, {
  AutocompleteFieldProps,
  AutocompleteOption,
} from "./autocomplete-field";

export type AutocompleteFieldOneTimeFetchProps = Omit<
  AutocompleteFieldProps,
  "options"
> & {
  /**
   * The server action to fetch data and get the result.
   * @returns The result of the server action.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oneTimeFetchAction: () => Promise<any>;
  /**
   * The function to get the options from the result of the server action.
   * @param result - The result of the server action.
   * @returns The options as an array of objects with label and value properties.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOptions: (result: any) => AutocompleteOption[];
  options?: AutocompleteOption[];
  onChange?: (option: AutocompleteOption | AutocompleteOption[]) => void;
};

/**
 * @description This is a server side autocomplete field that takes a server action and a function to get the options from the result of the server action.
 */
const AutocompleteFieldOneTimeFetch = (
  props: AutocompleteFieldOneTimeFetchProps
) => {
  const { oneTimeFetchAction, getOptions, ...rest } = props;
  const [options, setOptions] = useState<
    { label: string; value: string | number }[]
  >(props.options || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const oneTimeFetch = useCallback(
    async (force = false) => {
      try {
        if (loaded && !force) return;
        setLoading(true);
        const response = await oneTimeFetchAction();
        setOptions([...(props.options || []), ...getOptions(response)]);
        setLoaded(true);
        setError(false);
      } catch (error) {
        console.error(error);
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [loaded, oneTimeFetchAction, props.options, getOptions]
  );

  return (
    <AutocompleteField
      {...rest}
      onOpen={oneTimeFetch}
      loading={loading}
      getOptionsError={error}
      options={options}
    />
  );
};

export default AutocompleteFieldOneTimeFetch;
