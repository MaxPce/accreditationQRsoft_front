// src/utils/country.ts
const regionNames = new Intl.DisplayNames(["es"], { type: "region" });

export function getCountryName(isoCode: string): string {
  try {
    return regionNames.of(isoCode) || isoCode;
  } catch {
    return isoCode;
  }
}