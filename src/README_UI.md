4 files manage images and videos
1 – src/pages/ProductDetail.tsx
import { PRODUCTS } from '@/data/products'
Render Products in “Our Products” based on sequence set in pages/Products.tsx
2 - src/pages/Products.tsx
import { PRODUCTS } from '@/data/products'

3- src/components/home/FeaturedProducts.tsx
List the sequence of img/video on Home page (bottom) through ref id and file path.


4 - src/data/products.ts
All products and attributes including img (no video,only video-thumbnail) file path and idThe images  are displayed in the layer 2 /products through render of  ProductDetail.tsx  , “Our Products” where each id has a Tab. 
ProductDetail.tsx is based on it and FeaturedProducts.tsx ids and file paths must be aligned with it
