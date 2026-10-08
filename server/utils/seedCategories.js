import Category from "../models/Category.js";

const categories = [
  {
    name: "Men",
    description: "Everyday essentials and performance footwear for him.",
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Women",
    description: "Fresh, comfortable styles made to move with you.",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Sports",
    description: "Performance-ready footwear built for the long run.",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Hiking",
    description: "Find your footing, wherever the trail takes you.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Casual",
    description: "Easy everyday pairs, made for everywhere.",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=85",
  },
];

export async function seedCategories() {
  for (const defaults of categories) {
    let category = await Category.findOne({
      name: { $regex: `^${defaults.name}$`, $options: "i" },
    });

    if (!category) {
      await Category.create(defaults);
      continue;
    }

    let changed = false;
    for (const field of ["image", "description"]) {
      if (!category[field]?.trim()) {
        category[field] = defaults[field];
        changed = true;
      }
    }
    if (changed) await category.save();
  }
}
