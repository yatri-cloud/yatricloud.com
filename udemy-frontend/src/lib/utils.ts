export const clsx = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

export const cn = (...classes: (string | undefined | false)[]) => {
  return clsx(...classes);
};

export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

export const truncate = (text: string, length: number = 100) => {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
};
