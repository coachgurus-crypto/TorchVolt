export const productCategories = ["Solar panels", "Inverters", "Batteries", "Accessories"] as const;
export type ProductCategory = (typeof productCategories)[number];

export type ShopProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  spec: string;
  price: number;
  stock: number;
  image: string;
};

export type InventoryProduct = ShopProduct & {
  sku: string;
  published: 0 | 1;
  revision: number;
  updated_at: string;
};
