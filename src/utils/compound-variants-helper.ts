// ? this intend to help you create compound variants for the button component
// ? fix the styles for each variant then copy the output and paste it in the button component compoundVariants
const colors = [
  "primary",
  "secondary",
  "muted",
  "accent",
  "destructive",
] as const;

export const compoundVariants = [
  ...colors.map(
    (color) =>
      ({
        variant: "filled",
        color: color,
        className: `bg-${color} text-${color}-foreground hover:bg-${color}/80 hover:text-${color}-foreground focus:outline-${color}/80 focus:ring-${color}/80`,
      }) as const
  ),
  ...colors.map(
    (color) =>
      ({
        variant: "ghost",
        color: color,
        className: `bg-transparent text-${color} hover:bg-${color} hover:text-${color}-foreground focus:outline-${color} focus:ring-${color}`,
      }) as const
  ),
  ...colors.map(
    (color) =>
      ({
        variant: "outline",
        color: color,
        className: `bg-transparent text-${color} hover:bg-${color}/80 hover:text-${color}-foreground focus:outline-${color}-foreground focus:ring-${color}-foreground`,
      }) as const
  ),
];
