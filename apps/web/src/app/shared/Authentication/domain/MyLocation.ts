export type MyLocation = {
  country: {
    id: string;
    name: string;
    code: string;
  };
  cities: {
    id: string;
    name: string;
  }[];
};