export interface Address {
  id?: number;         // optional, weil neu erzeugt noch keine ID hat
  street: string;
  postalCode: string;
  city: string;
  country: string;
}