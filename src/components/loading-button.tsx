import { Circles } from "react-loader-spinner";

import { cn } from "@/lib/utils";

type ButtonVariant = "contained" | "outlined" | "text";
type ButtonSize = "small" | "medium" | "large";

const LoadingButton = ({
  sending,
  title,
  loadingText,
  variant = "contained",
  size = "medium",
  buttonProps,
  color = "#8355a0",
}: {
  sending: boolean;
  title: React.ReactNode;
  loadingText: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  color?: string;
}) => {
  const getButtonStyles = (variant: ButtonVariant) => {
    const baseStyles = cn(
      "flex-1 rounded-lg font-normal transition-colors",
      // Size variants
      size === "small" && "py-1 text-sm",
      size === "medium" && "py-2 text-base",
      size === "large" && "py-3 text-lg"
    );

    switch (variant) {
      case "outlined":
        return `${baseStyles} border-2 border-custom-primary-accent text-custom-primary-accent hover:bg-custom-primary-accent/10`;
      case "text":
        return `${baseStyles} text-custom-primary-accent hover:bg-custom-primary-accent/10`;
      default: // contained
        return `${baseStyles} bg-custom-primary-accent text-white hover:bg-custom-primary-accent/90`;
    }
  };

  const getLoaderSize = () => {
    switch (size) {
      case "small":
        return { height: "20", width: "20", wrapperClass: "h-5 w-5" };
      case "large":
        return { height: "30", width: "30", wrapperClass: "h-7 w-7" };
      default: // medium
        return { height: "25", width: "25", wrapperClass: "h-6 w-6" };
    }
  };

  const loaderSize = getLoaderSize();

  return (
    <button
      {...buttonProps}
      type={buttonProps?.type || "submit"}
      disabled={buttonProps?.disabled || sending}
      className={cn(getButtonStyles(variant), buttonProps?.className)}
    >
      {sending ? (
        <div className="flex items-center justify-center gap-2">
          <p
            className={
              variant === "contained"
                ? "text-white"
                : "text-custom-primary-accent"
            }
          >
            {loadingText}
          </p>
          <Circles
            height={loaderSize.height}
            width={loaderSize.width}
            ariaLabel="circles-loading"
            color={color}
            wrapperStyle={{}}
            wrapperClass={cn(
              loaderSize.wrapperClass,
              variant === "contained"
                ? "text-white"
                : "text-custom-primary-accent"
            )}
            visible={true}
          />
        </div>
      ) : (
        title
      )}
    </button>
  );
};

export default LoadingButton;
