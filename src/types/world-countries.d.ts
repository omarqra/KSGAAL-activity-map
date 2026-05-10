declare module "world-countries" {
  interface WorldCountry {
    cca2: string;
    cca3: string;
    name: {
      common: string;
      official: string;
    };
    translations: Record<
      string,
      { common: string; official: string }
    >;
    latlng: [number, number];
    capital: string[];
    flag: string;
    region: string;
    subregion: string;
  }
  const data: WorldCountry[];
  export default data;
}
