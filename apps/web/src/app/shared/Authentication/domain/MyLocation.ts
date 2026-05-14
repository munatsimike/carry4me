export type MyLocation = {
  country: {
    id: number;
    name: string;
    code: string;
  };
  cities: {
    id: number;
    name: string;
  }[];
};