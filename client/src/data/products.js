const photo = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const productPhotos = [
  'photo-1600269452121-4f2416e55c28',
  'photo-1600185365483-26d7a4cc7519',
  'photo-1600185365926-3a2ce3cdb9eb',
  'photo-1549298916-b41d501d3772',
  'photo-1608231387042-66d1773070a5',
  'photo-1605348532760-6753d2c43329',
  'photo-1551107696-a4b0c5a0d9a2',
  'photo-1605408499391-6368c628ef42',
  'photo-1608256246200-53e635b5b65f',
  'photo-1579338559194-a162d19bf842',
  'photo-1552066344-2464c1135c32',
  'photo-1542291026-7eec264c27ff',
  'photo-1525966222134-fcfa99b8ae77',
  'photo-1495555961986-6d4c1ecb7be3',
  'photo-1539185441755-769473a23570',
  'photo-1552346154-21d32810aba3',
  'photo-1551632811-561732d1e306',
  'photo-1543163521-1bf539c55dd2',
  'photo-1461896836934-ffe607ba8211',
  'photo-1514989940723-e8e51635b782',
  'photo-1512374382149-233c42b6a83b',
  'photo-1515955656352-a1fa3ffcd111',
  'photo-1520256862855-398228c41684',
  'photo-1531310197839-ccf54634509e',
]

const catalog = [
  ['Cloudrunner Everyday Sneaker', 'On', 'Running', 'Men', 18400, 22900, 'Like New', 'photo-1542291026-7eec264c27ff'],
  ['Air Zoom Pegasus 40', 'Nike', 'Running', 'Men', 21900, 27900, 'New', 'photo-1542291026-7eec264c27ff'],
  ['Gazelle Indoor', 'Adidas', 'Casual', 'Women', 16800, 21000, 'New', 'photo-1525966222134-fcfa99b8ae77'],
  ['Chuck 70 High Top', 'Converse', 'Casual', 'Unisex', 14500, 18900, 'Like New', 'photo-1495555961986-6d4c1ecb7be3'],
  ['574 Core Sneaker', 'New Balance', 'Casual', 'Men', 19500, 24500, 'New', 'photo-1539185441755-769473a23570'],
  ['Classic Leather', 'Reebok', 'Casual', 'Women', 13900, 17900, 'Like New', 'photo-1542291026-7eec264c27ff'],
  ['Terrex Trail Hiking', 'Adidas', 'Hiking', 'Men', 24900, 31900, 'New', 'photo-1551632811-561732d1e306'],
  ['Speedcross 6 Trail', 'Salomon', 'Hiking', 'Unisex', 28900, 34900, 'New', 'photo-1551632811-561732d1e306'],
  ['Air Force 1 Low', 'Nike', 'Casual', 'Women', 22900, 27900, 'New', 'photo-1542291026-7eec264c27ff'],
  ['Ultraboost Light', 'Adidas', 'Running', 'Men', 29900, 36900, 'New', 'photo-1539185441755-769473a23570'],
  ['574 Vintage Pack', 'New Balance', 'Sports', 'Women', 15900, 20900, 'Used', 'photo-1539185441755-769473a23570'],
  ['Gel-Kayano 30', 'ASICS', 'Running', 'Men', 26900, 32900, 'New', 'photo-1542291026-7eec264c27ff'],
  ['Old Skool Classic', 'Vans', 'Casual', 'Unisex', 13500, 16900, 'Like New', 'photo-1495555961986-6d4c1ecb7be3'],
  ['Fresh Foam 1080', 'New Balance', 'Running', 'Women', 25900, 31900, 'New', 'photo-1539185441755-769473a23570'],
  ['Court Legacy Lift', 'Nike', 'Casual', 'Women', 17400, 21900, 'Like New', 'photo-1525966222134-fcfa99b8ae77'],
  ['Moab 3 Hiking Shoe', 'Merrell', 'Hiking', 'Men', 23500, 28900, 'New', 'photo-1551632811-561732d1e306'],
  ['Superstar Original', 'Adidas', 'Casual', 'Unisex', 18900, 23900, 'New', 'photo-1525966222134-fcfa99b8ae77'],
  ['Pegasus Trail 4', 'Nike', 'Hiking', 'Women', 22500, 27900, 'Refurbished', 'photo-1551632811-561732d1e306'],
  ['Gel-1130 Retro', 'ASICS', 'Sports', 'Unisex', 17900, 22900, 'New', 'photo-1542291026-7eec264c27ff'],
  ['Classic Club C 85', 'Reebok', 'Casual', 'Men', 14900, 18900, 'Used', 'photo-1495555961986-6d4c1ecb7be3'],
  ['Cloud 5 Waterproof', 'On', 'Hiking', 'Women', 27800, 33900, 'New', 'photo-1551632811-561732d1e306'],
  ['Air Max Excee', 'Nike', 'Sports', 'Men', 19900, 24900, 'Like New', 'photo-1542291026-7eec264c27ff'],
  ['Forum Low Classic', 'Adidas', 'Sports', 'Women', 18500, 23900, 'New', 'photo-1525966222134-fcfa99b8ae77'],
  ['574 Rugged', 'New Balance', 'Hiking', 'Men', 20900, 26900, 'Refurbished', 'photo-1551632811-561732d1e306'],
]

export const products = catalog.map(([name, brand, category, gender, price, originalPrice, condition], index) => ({
  id: `shoe-${index + 1}`,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''),
  brand,
  category,
  gender,
  price,
  originalPrice,
  discount: Math.round((1 - price / originalPrice) * 100),
  images: [photo(productPhotos[index]), photo(productPhotos[(index + 1) % productPhotos.length])],
  thumbnail: photo(productPhotos[index], 600),
  sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44].filter((size) => (size + index) % 5 !== 0),
  colors: ['White / Grey', 'Black', 'Sandstone'],
  condition,
  description: `Designed for all-day comfort, the ${name} pairs dependable construction with an easy-to-wear silhouette. A versatile everyday favorite, ready for your next move.`,
  features: ['Comfort-first cushioned footbed', 'Durable rubber outsole', 'Breathable upper construction'],
  stock: index % 7 === 0 ? 3 : 12 + (index % 9),
  rating: Number((4.1 + (index % 9) / 10).toFixed(1)),
  reviewsCount: 18 + index * 7,
  featured: index < 8,
  bestseller: index % 3 === 0,
  newArrival: index % 4 === 0,
}))

export const categories = [
  { name: 'Men', slug: 'men', image: photo('photo-1552346154-21d32810aba3'), description: 'Everyday essentials and performance footwear for him.' },
  { name: 'Women', slug: 'women', image: photo('photo-1543163521-1bf539c55dd2'), description: 'Fresh, comfortable styles made to move with you.' },
  { name: 'Sports', slug: 'sports', image: photo('photo-1461896836934-ffe607ba8211'), description: 'Performance-ready footwear built for the long run.' },
  { name: 'Hiking', slug: 'hiking', image: photo('photo-1551632811-561732d1e306'), description: 'Find your footing, wherever the trail takes you.' },
  { name: 'Casual', slug: 'casual', image: photo('photo-1525966222134-fcfa99b8ae77'), description: 'Easy everyday pairs, made for everywhere.' },
]

export const brands = ['Nike', 'Adidas', 'New Balance', 'On', 'ASICS', 'Converse', 'Reebok', 'Salomon']
export const sizes = [36, 37, 38, 39, 40, 41, 42, 43, 44]

export const orders = [
  { id: 'MG-24091852', date: 'Sep 18, 2026', status: 'Shipped', total: 40300, items: [{ productId: 'shoe-2', quantity: 1 }, { productId: 'shoe-4', quantity: 1 }] },
  { id: 'MG-24082719', date: 'Aug 27, 2026', status: 'Delivered', total: 22900, items: [{ productId: 'shoe-1', quantity: 1 }] },
  { id: 'MG-24071034', date: 'Jul 10, 2026', status: 'Delivered', total: 16800, items: [{ productId: 'shoe-3', quantity: 1 }] },
  { id: 'MG-24062841', date: 'Jun 28, 2026', status: 'Out for Delivery', total: 25900, items: [{ productId: 'shoe-14', quantity: 1 }] },
  { id: 'MG-24051603', date: 'May 16, 2026', status: 'Confirmed', total: 24900, items: [{ productId: 'shoe-7', quantity: 1 }] },
  { id: 'MG-24040927', date: 'Apr 9, 2026', status: 'Processing', total: 13900, items: [{ productId: 'shoe-6', quantity: 1 }] },
  { id: 'MG-24031864', date: 'Mar 18, 2026', status: 'Cancelled', total: 0, items: [{ productId: 'shoe-20', quantity: 1 }] },
]

export const banners = [
  { eyebrow: 'THE EVERYDAY EDIT', title: 'Good shoes.\nBetter days.', text: 'A new season of all-day favorites has arrived.', action: 'Shop the collection', href: '/shop', image: photo('photo-1495555961986-6d4c1ecb7be3', 1500) },
]
