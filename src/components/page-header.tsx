import { SparklesText } from "./ui/sparkles-text";

interface PageHeaderProps {
  title: string;
  subTitle: string;
  actionButton?: React.ReactNode;
}

const PageHeader = ({ subTitle, title, actionButton }: PageHeaderProps) => {
  return (
    <div className="flex w-full items-center justify-between px-2 sm:px-0">
      <div className="flex flex-col gap-px">
        <SparklesText
          colors={{
            first: "var(--accent-foreground)",
            second: "var(--muted-foreground)",
          }}
          sparklesCount={3}
          className="text-primary text-[24px]"
        >
          {title}
        </SparklesText>
        <p className="text-muted-foreground text-[16px]">{subTitle}</p>
      </div>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default PageHeader;
