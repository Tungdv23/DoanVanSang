export const cn = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(' ');
