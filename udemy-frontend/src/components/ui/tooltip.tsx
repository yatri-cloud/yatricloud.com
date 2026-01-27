import React from "react";

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-sm text-background">
          {content}
        </div>
      )}
    </div>
  );
};

const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export { Tooltip, TooltipProvider };
