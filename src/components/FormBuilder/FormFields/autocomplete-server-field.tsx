import { useCallback, useEffect, useState } from "react";

import { useDebounce } from "../utils/use-debounce";
import AutocompleteField, {
  AutocompleteFieldProps,
  AutocompleteOption,
} from "./autocomplete-field";

/**
 * @description This is a server side autocomplete field that takes a server action and a function to get the options from the result of the server action.
 */

export type AutocompleteFieldServerProps = Omit<
  AutocompleteFieldProps,
  "options"
> & {
  multiple?: boolean;
  /**
   * The server action to fetch data and get the result.
   * @param value - The value to search for.
   * @returns The result of the server action.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serverAction: (value: string) => Promise<any>;
  /**
   * The function to get the options from the result of the server action.
   * @param result - The result of the server action.
   * @returns The options as an array of objects with label and value properties.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOptions: (result: any) => AutocompleteOption[];
  refetchOnOpen?: boolean;
};

const AutocompleteFieldServer = (props: AutocompleteFieldServerProps) => {
  const {
    serverAction,
    getOptions,
    onChange,
    refetchOnOpen = false,
    ...rest
  } = props;
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const debouncedValue = useDebounce(searchValue, 500);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<AutocompleteOption[]>(
    []
  );
  const [error, setError] = useState(false);
  const [openTrigger, setOpenTrigger] = useState(0);

  const serverSearch = useCallback(
    async (value: string) => {
      try {
        setLoading(true);
        const response = await serverAction(value);
        setError(false);
        return getOptions(response);
      } catch (error) {
        console.error(error);
        setError(true);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [serverAction, getOptions]
  );

  useEffect(() => {
    serverSearch(debouncedValue).then((options) => {
      if (selectedOptions.length > 0) {
        const selectedOptionsValues = selectedOptions.map(
          (option) => option.value
        );
        const optionsExcludingSelected = options.filter(
          (option) => !selectedOptionsValues.includes(option.value)
        );
        setOptions([...selectedOptions, ...optionsExcludingSelected]);
      } else {
        setOptions(options);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, openTrigger]);

  const handleOneTimeFetch = useCallback(() => {
    if (refetchOnOpen) {
      setOpenTrigger((prev) => prev + 1);
    }
  }, [refetchOnOpen]);

  return (
    <AutocompleteField
      {...rest}
      serverSearch={(e) => setSearchValue(e)}
      onChange={(e) => {
        setSelectedOptions(
          options.filter((option) => {
            if (Array.isArray(e)) {
              return e.some(
                (selected_option) => selected_option.value === option.value
              );
            } else {
              return e.value === option.value;
            }
          })
        );
        onChange?.(e);
      }}
      loading={loading}
      getOptionsError={error}
      options={options}
      onOpen={handleOneTimeFetch}
    />
  );
};

export default AutocompleteFieldServer;
