export const formatDate = (value: string | number | Date) =>
  new Date(value).toISOString();
