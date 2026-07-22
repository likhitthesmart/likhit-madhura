/* Seeds the full Madhura Naturals catalog, content and an admin account. Idempotent (upserts). */
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const media = (p: string) => `/media/${p}`;

const categories = [
  { slug: "cold-pressed-oils", name: "Cold Pressed Oils", description: "Wood-pressed the slow way, in small batches — nothing heated, nothing lost.", sortOrder: 1 },
  { slug: "ghee", name: "A2 Ghee", description: "Bilona-churned golden ghee from grass-fed desi cows.", sortOrder: 2 },
  { slug: "sugar-jaggery", name: "Organic Sugar & Jaggery", description: "Unrefined sweetness straight from organic sugarcane.", sortOrder: 3 },
  { slug: "millets", name: "Millets", description: "Ancient grains from rain-fed farms — jowar, ragi and brown top.", sortOrder: 4 },
  { slug: "flours-atta", name: "Flours & Atta", description: "Stone-ground fresh every week, the way our grandmothers did.", sortOrder: 5 },
  { slug: "idly-ravva", name: "Idly Ravva", description: "Coarse-milled millet ravva for the softest idlis.", sortOrder: 6 },
  { slug: "spices-traditionals", name: "Spices & Traditionals", description: "Turmeric, kumkum and inguva — pure as tradition demands.", sortOrder: 7 },
  { slug: "healthy-biscuits", name: "Healthy Biscuits", description: "Small-batch baked with millets and jaggery. Never maida, never refined sugar.", sortOrder: 8 },
].map((c) => ({ ...c, image: media(`categories/${c.slug}.jpg`) }));

type SeedProduct = {
  slug: string; name: string; tagline: string; description: string;
  price: number; mrp: number; unit: string; category: string;
  tags: string[]; bestSeller?: boolean; featured?: boolean; stock?: number;
  nutrition: Record<string, string>; ingredients: string[]; benefits: string[];
  storage: string; uses: string[]; faqs: { q: string; a: string }[];
};

const storageCool = "Store in a cool, dry place away from direct sunlight. Keep tightly closed after opening.";

const products: SeedProduct[] = [
  {
    slug: "groundnut-oil", name: "Cold Pressed Groundnut Oil", tagline: "Slow wood-pressed, nutty and golden",
    description: "Our groundnut oil is pressed on a traditional wooden ghani at low RPM so the oil never heats above 40°C. The result is a deeply aromatic, unrefined oil with its vitamin E, antioxidants and natural nutty flavour fully intact. Sourced from rain-fed organic farms in Telangana and pressed in small weekly batches.",
    price: 44900, mrp: 49900, unit: "1 L", category: "cold-pressed-oils", tags: ["oil", "groundnut", "peanut", "cooking"], bestSeller: true, featured: true,
    nutrition: { Energy: "884 kcal", Fat: "100 g", "Saturated Fat": "17 g", MUFA: "46 g", PUFA: "32 g", "Vitamin E": "15.7 mg" },
    ingredients: ["100% organic groundnuts (cold pressed)"],
    benefits: ["Rich in vitamin E and antioxidants", "High smoke point — ideal for Indian cooking", "No chemicals, hexane or refining", "Heart-friendly MUFA-rich profile"],
    storage: storageCool,
    uses: ["Everyday sabzi and dal tadka", "Deep frying vadas and chips", "Traditional pickles"],
    faqs: [
      { q: "Why does the oil look cloudy?", a: "Cold pressed oil is unrefined and unfiltered beyond simple sieving — natural sediment is a sign of purity and settles at the bottom." },
      { q: "What is the shelf life?", a: "6 months from pressing date, printed on every bottle." },
    ],
  },
  {
    slug: "sesame-oil", name: "Cold Pressed Sesame Oil", tagline: "The gingelly gold of South Indian kitchens",
    description: "Pressed from sun-dried white sesame on a wooden ghani, this nallennai is the soul of South Indian cooking — from idli podi to pickle to oil pulling. Unrefined, unbleached and full of sesamin and natural antioxidants.",
    price: 52900, mrp: 57900, unit: "1 L", category: "cold-pressed-oils", tags: ["oil", "sesame", "gingelly", "nallennai"], bestSeller: true, featured: true,
    nutrition: { Energy: "884 kcal", Fat: "100 g", "Saturated Fat": "14 g", MUFA: "40 g", PUFA: "42 g" },
    ingredients: ["100% organic white sesame seeds (cold pressed)"],
    benefits: ["Traditional choice for oil pulling", "Rich in sesamin and antioxidants", "Deep, authentic flavour for podis and pickles"],
    storage: storageCool,
    uses: ["Idli podi and rice mixes", "Pickling", "Oil pulling and abhyanga massage"],
    faqs: [{ q: "Is this the same as til oil?", a: "Yes — sesame, gingelly, til and nallennai all refer to the same seed." }],
  },
  {
    slug: "coconut-oil", name: "Cold Pressed Coconut Oil", tagline: "From sun-dried copra, pressed within the week",
    description: "Made from hand-picked coconuts dried into copra and cold pressed in small batches. Naturally sweet aroma, high lauric acid, and equally at home in the kitchen and in hair care rituals.",
    price: 39900, mrp: 44900, unit: "500 ml", category: "cold-pressed-oils", tags: ["oil", "coconut", "hair", "skin"], featured: true,
    nutrition: { Energy: "892 kcal", Fat: "100 g", "Saturated Fat": "87 g", "Lauric Acid": "45 g" },
    ingredients: ["100% organic copra (cold pressed)"],
    benefits: ["High in lauric acid", "Multi-purpose: cooking, hair and skin", "No heat, no solvents, no refining"],
    storage: "May solidify below 24°C — this is natural. Place the jar in warm water to liquefy.",
    uses: ["South Indian curries and stir fries", "Hair and scalp massage", "Baby massage and skin care"],
    faqs: [{ q: "Why has my oil turned solid?", a: "Pure coconut oil solidifies below ~24°C. It melts back naturally and quality is unaffected." }],
  },
  {
    slug: "safflower-oil", name: "Cold Pressed Safflower Oil", tagline: "Light, delicate and heart-friendly",
    description: "A light golden oil pressed from organic safflower (kusuma) seeds. Mild in taste with a high PUFA content, it suits everyday cooking for health-conscious homes.",
    price: 49900, mrp: 54900, unit: "1 L", category: "cold-pressed-oils", tags: ["oil", "safflower", "kusuma"],
    nutrition: { Energy: "884 kcal", Fat: "100 g", PUFA: "75 g", "Vitamin E": "34 mg" },
    ingredients: ["100% organic safflower seeds (cold pressed)"],
    benefits: ["Very high PUFA content", "Light neutral taste", "Cold pressed, never refined"],
    storage: storageCool,
    uses: ["Everyday light cooking", "Salad dressings", "Baby food preparation"],
    faqs: [],
  },
  {
    slug: "a2-cow-ghee", name: "A2 Desi Cow Ghee", tagline: "Bilona-churned from curd, not cream",
    description: "Made the slow vedic way: whole A2 milk from grass-fed desi cows is cultured into curd, hand-churned into butter, and simmered gently over a wood fire. Grainy texture, golden colour and an aroma that fills the whole house.",
    price: 149900, mrp: 169900, unit: "500 ml", category: "ghee", tags: ["ghee", "a2", "bilona", "desi cow"], bestSeller: true, featured: true,
    nutrition: { Energy: "897 kcal", Fat: "99.7 g", "Vitamin A": "840 µg", "Butyric Acid": "3.2 g" },
    ingredients: ["A2 desi cow milk curd (bilona churned)"],
    benefits: ["Traditional bilona method", "Rich in butyric acid and fat-soluble vitamins", "From grass-fed indigenous cows", "Lab tested for purity"],
    storage: "Store at room temperature away from moisture. Always use a dry spoon. No refrigeration needed.",
    uses: ["Daily rice, rotis and dals", "Festive sweets and prasadam", "Ayurvedic preparations"],
    faqs: [
      { q: "Why is the texture grainy?", a: "Danedar (grainy) texture is the hallmark of curd-churned bilona ghee cooked at the right temperature." },
      { q: "Which breed of cow?", a: "Our ghee comes from Gir and Sahiwal cows raised on open pasture." },
    ],
  },
  {
    slug: "organic-sugar", name: "Organic Country Sugar", tagline: "Sweetness with its minerals left in",
    description: "Unrefined country sugar (nattu sakkarai) crystallised from organic sugarcane juice without sulphur or bleaching. Amber-hued, mineral-rich and perfect wherever you would use white sugar.",
    price: 18900, mrp: 21900, unit: "1 kg", category: "sugar-jaggery", tags: ["sugar", "country sugar", "nattu sakkarai"], featured: true,
    nutrition: { Energy: "389 kcal", Carbohydrates: "97 g", Iron: "2.5 mg", Calcium: "80 mg" },
    ingredients: ["100% organic sugarcane juice"],
    benefits: ["No sulphur, no bone char, no bleaching", "Retains natural minerals", "Direct from organic farmer collectives"],
    storage: storageCool,
    uses: ["Tea, coffee and payasam", "Baking", "Everyday sweetening"],
    faqs: [{ q: "Why is it brown, not white?", a: "We skip the refining and bleaching that strips minerals — the amber colour is how real sugar looks." }],
  },
  {
    slug: "jaggery-powder", name: "Organic Jaggery Powder", tagline: "Sun-dried, chemical-free bellam",
    description: "Golden jaggery powder made by slow-boiling organic sugarcane juice in open iron pans, then sun-drying and powdering. No soda, no super-phosphate, no colour.",
    price: 15900, mrp: 17900, unit: "500 g", category: "sugar-jaggery", tags: ["jaggery", "bellam", "gur"], bestSeller: true,
    nutrition: { Energy: "383 kcal", Carbohydrates: "95 g", Iron: "11 mg", Magnesium: "70 mg" },
    ingredients: ["100% organic sugarcane juice"],
    benefits: ["Iron-rich natural sweetener", "Made without chemicals or clarifiers", "Dissolves easily in drinks and sweets"],
    storage: storageCool,
    uses: ["Filter coffee and herbal kashayam", "Traditional sweets", "Straight after meals, the old way"],
    faqs: [],
  },
  {
    slug: "jowar", name: "Organic Jowar", tagline: "Pearl-white sorghum from rain-fed farms",
    description: "Whole white jowar grown without chemicals on rain-fed lands. Gluten-free, fibre-rich and endlessly versatile — from jonna rotte to salads.",
    price: 12900, mrp: 14900, unit: "1 kg", category: "millets", tags: ["millet", "jowar", "sorghum", "gluten free"],
    nutrition: { Energy: "349 kcal", Protein: "10.4 g", Fibre: "9.7 g", Iron: "4.1 mg" },
    ingredients: ["100% organic whole jowar"],
    benefits: ["Naturally gluten-free", "High fibre for gut health", "Low glycemic index"],
    storage: storageCool,
    uses: ["Jonna rotte", "Millet salads and upma", "Multigrain flour mixes"],
    faqs: [],
  },
  {
    slug: "ragi", name: "Organic Ragi", tagline: "Calcium-dense finger millet",
    description: "Deep maroon finger millet from tribal organic farms. Among the richest natural sources of calcium — the grain South Indian mothers have trusted for generations.",
    price: 11900, mrp: 13900, unit: "1 kg", category: "millets", tags: ["millet", "ragi", "finger millet", "calcium"], bestSeller: true,
    nutrition: { Energy: "336 kcal", Protein: "7.7 g", Calcium: "364 mg", Fibre: "11.5 g" },
    ingredients: ["100% organic whole ragi"],
    benefits: ["Exceptional calcium content", "Great for growing children and new mothers", "Keeps you full longer"],
    storage: storageCool,
    uses: ["Ragi java (porridge)", "Sprouted ragi malt", "Dosas and rotis"],
    faqs: [],
  },
  {
    slug: "brown-top-millet", name: "Brown Top Millet", tagline: "The rarest of the five positive millets",
    description: "Andu korralu — the rare brown top millet revived by traditional farmers. A delicate, quick-cooking grain prized in millet-based healing diets.",
    price: 19900, mrp: 22900, unit: "500 g", category: "millets", tags: ["millet", "brown top", "andu korralu", "positive millet"],
    nutrition: { Energy: "338 kcal", Protein: "8.9 g", Fibre: "12.5 g" },
    ingredients: ["100% organic brown top millet"],
    benefits: ["One of the five positive millets", "High fibre, gentle on digestion", "Grown by heritage seed savers"],
    storage: storageCool,
    uses: ["Millet rice", "Khichdi and pongal", "Porridge"],
    faqs: [],
  },
  {
    slug: "kapli-atta", name: "Kapli Atta", tagline: "Heritage emmer wheat, stone-ground",
    description: "Atta milled from Khapli (emmer) wheat — an ancient long-strand wheat that is easier to digest and lower on the glycemic index than modern varieties. Stone-ground slowly to keep the germ and bran intact.",
    price: 24900, mrp: 27900, unit: "1 kg", category: "flours-atta", tags: ["atta", "khapli", "emmer", "wheat"], featured: true,
    nutrition: { Energy: "330 kcal", Protein: "12 g", Fibre: "10.7 g" },
    ingredients: ["100% organic Khapli (emmer) wheat"],
    benefits: ["Ancient grain, easier digestion", "Lower gluten strength than modern wheat", "Stone-ground fresh weekly"],
    storage: storageCool,
    uses: ["Soft phulkas and rotis", "Parathas", "Baking breads"],
    faqs: [{ q: "Is Khapli gluten-free?", a: "No — it contains gluten, but a weaker, more digestible form than modern hybrid wheat." }],
  },
  {
    slug: "ragi-flour", name: "Ragi Flour", tagline: "Freshly milled finger millet flour",
    description: "Our whole ragi, cleaned, gently dried and stone-milled into fine flour. Nothing added, nothing removed.",
    price: 13900, mrp: 15900, unit: "1 kg", category: "flours-atta", tags: ["ragi", "flour", "millet flour"],
    nutrition: { Energy: "336 kcal", Protein: "7.7 g", Calcium: "344 mg", Fibre: "11.2 g" },
    ingredients: ["100% organic ragi (stone milled)"],
    benefits: ["Calcium-rich everyday flour", "Perfect texture for dosas and mudde", "Milled in small weekly batches"],
    storage: storageCool,
    uses: ["Ragi mudde", "Ragi dosa and rotti", "Baby porridge (with milk)"],
    faqs: [],
  },
  {
    slug: "jonna-pindi", name: "Jonna Pindi", tagline: "Fine jowar flour for the softest rotte",
    description: "Creamy-white sorghum flour milled from our organic jowar. The staple flour of Telangana kitchens for jonna rotte and more.",
    price: 13900, mrp: 15900, unit: "1 kg", category: "flours-atta", tags: ["jowar", "flour", "jonna pindi", "sorghum flour"],
    nutrition: { Energy: "349 kcal", Protein: "10.4 g", Fibre: "9.7 g" },
    ingredients: ["100% organic jowar (stone milled)"],
    benefits: ["Gluten-free staple flour", "Soft, pliable rotte every time", "No preservatives or blending"],
    storage: storageCool,
    uses: ["Jonna rotte", "Millet dosa batter", "Porridge"],
    faqs: [],
  },
  {
    slug: "jonna-idly-ravva", name: "Jonna Idly Ravva", tagline: "Sorghum ravva for cloud-soft idlis",
    description: "Coarse-milled jowar ravva that swaps rice out of your idli batter without losing softness. Ferments beautifully with urad dal.",
    price: 14900, mrp: 16900, unit: "500 g", category: "idly-ravva", tags: ["idly", "ravva", "jowar", "jonna"],
    nutrition: { Energy: "349 kcal", Protein: "10.4 g", Fibre: "9.7 g" },
    ingredients: ["100% organic jowar (coarse milled)"],
    benefits: ["Diabetic-friendly idli base", "Ferments like rice ravva", "Light on the stomach"],
    storage: storageCool,
    uses: ["Idlis (3:1 with urad dal)", "Upma", "Steamed dhoklas"],
    faqs: [{ q: "How do I substitute rice ravva?", a: "Use 1:1 in your usual recipe; soak 4–5 hours and ferment overnight." }],
  },
  {
    slug: "ragi-idly-ravva", name: "Ragi Idly Ravva", tagline: "Finger millet ravva, calcium in every idli",
    description: "Coarse ragi ravva for deep-brown, nutty idlis packed with calcium and fibre. A favourite for school tiffins.",
    price: 14900, mrp: 16900, unit: "500 g", category: "idly-ravva", tags: ["idly", "ravva", "ragi"],
    nutrition: { Energy: "336 kcal", Calcium: "344 mg", Fibre: "11.2 g" },
    ingredients: ["100% organic ragi (coarse milled)"],
    benefits: ["Calcium-dense breakfasts", "Kid-friendly nutty taste", "Ferments overnight"],
    storage: storageCool,
    uses: ["Ragi idlis", "Instant upma", "Porridge"],
    faqs: [],
  },
  {
    slug: "turmeric-powder", name: "Organic Turmeric Powder", tagline: "High-curcumin Salem turmeric",
    description: "Single-origin Salem turmeric, boiled, sun-dried and cold-ground the traditional way. Vibrant colour, strong aroma and naturally high curcumin — never polished or dyed.",
    price: 16900, mrp: 18900, unit: "250 g", category: "spices-traditionals", tags: ["turmeric", "haldi", "pasupu", "curcumin"], bestSeller: true, featured: true,
    nutrition: { Energy: "312 kcal", Curcumin: "3.8%", Iron: "55 mg" },
    ingredients: ["100% organic turmeric rhizomes"],
    benefits: ["Lab-tested curcumin content", "No lead chromate or artificial colour", "Traditional sun-drying preserves oils"],
    storage: storageCool,
    uses: ["Daily cooking", "Golden milk (turmeric latte)", "Traditional skincare"],
    faqs: [{ q: "Is it tested for adulteration?", a: "Every batch is lab tested for lead chromate, starch and artificial colours. Reports available on request." }],
  },
  {
    slug: "kumkum", name: "Pure Kumkum", tagline: "Temple-grade, made from real turmeric",
    description: "Authentic kumkum prepared from our own turmeric and food-grade slaked lime — the way temple kumkum has always been made. Deep crimson, soft on skin, completely free of industrial dyes.",
    price: 9900, mrp: 11900, unit: "100 g", category: "spices-traditionals", tags: ["kumkum", "pooja", "traditional"],
    nutrition: {},
    ingredients: ["Organic turmeric", "Food-grade slaked lime"],
    benefits: ["No industrial dyes or lead", "Skin-safe, traditional preparation", "Temple-grade quality"],
    storage: "Keep dry. Use a dry spoon or finger.",
    uses: ["Daily pooja", "Festivals and functions", "Return gifts"],
    faqs: [],
  },
  {
    slug: "inguva", name: "Pure Inguva", tagline: "Strong, clean asafoetida",
    description: "Premium asafoetida compounded with just enough fenugreek and edible gum to make it kitchen-ready. Intense aroma — a pinch is enough.",
    price: 19900, mrp: 21900, unit: "50 g", category: "spices-traditionals", tags: ["inguva", "hing", "asafoetida"],
    nutrition: {},
    ingredients: ["Asafoetida resin", "Fenugreek", "Edible gum"],
    benefits: ["Digestive aid in dals and rasam", "No wheat flour fillers", "Strong aroma, use sparingly"],
    storage: "Keep tightly closed — the aroma travels!",
    uses: ["Dal and sambar tadka", "Rasam", "Pickles"],
    faqs: [],
  },
  {
    slug: "ragi-almond-biscuits", name: "Ragi Almond Biscuits", tagline: "Crunchy ragi, buttery almonds, zero maida",
    description: "Hand-cut biscuits baked with our ragi flour, almond slivers, A2 ghee and jaggery. No maida, no refined sugar, no palm oil — just honest crunch.",
    price: 17900, mrp: 19900, unit: "200 g", category: "healthy-biscuits", tags: ["biscuits", "ragi", "almond", "snacks"], featured: true,
    nutrition: { Energy: "465 kcal", Protein: "9 g", Fibre: "6 g" },
    ingredients: ["Ragi flour", "Jaggery", "A2 ghee", "Almonds", "Cardamom"],
    benefits: ["No maida or refined sugar", "Baked in A2 ghee", "Kid-approved tiffin snack"],
    storage: "Consume within 45 days. Keep airtight after opening.",
    uses: ["Tea-time", "School tiffins", "Guilt-free dessert"],
    faqs: [],
  },
  {
    slug: "millet-jaggery-biscuits", name: "Millet Jaggery Biscuits", tagline: "Five millets, one honest biscuit",
    description: "A blend of jowar, ragi, and the positive millets sweetened only with jaggery and baked in ghee — rustic, satisfying and wholesome.",
    price: 16900, mrp: 18900, unit: "200 g", category: "healthy-biscuits", tags: ["biscuits", "millet", "jaggery", "snacks"],
    nutrition: { Energy: "455 kcal", Protein: "8 g", Fibre: "7 g" },
    ingredients: ["Mixed millet flour", "Jaggery", "A2 ghee", "Sesame"],
    benefits: ["Multi-millet fibre boost", "Jaggery-only sweetness", "No preservatives"],
    storage: "Consume within 45 days. Keep airtight after opening.",
    uses: ["Tea-time", "Travel snack", "Mid-meal hunger"],
    faqs: [],
  },
  {
    slug: "multigrain-honey-biscuits", name: "Multigrain Honey Biscuits", tagline: "Slow-baked with forest honey",
    description: "Khapli wheat, oats and millets brought together with wild forest honey and ghee. Lightly sweet, deeply satisfying.",
    price: 18900, mrp: 20900, unit: "200 g", category: "healthy-biscuits", tags: ["biscuits", "multigrain", "honey", "snacks"],
    nutrition: { Energy: "470 kcal", Protein: "9.5 g", Fibre: "5.5 g" },
    ingredients: ["Khapli wheat", "Oats", "Millet flour", "Forest honey", "A2 ghee"],
    benefits: ["Sweetened with forest honey", "Ancient-grain base", "Small-batch baked"],
    storage: "Consume within 45 days. Keep airtight after opening.",
    uses: ["Breakfast on busy days", "Tea-time", "Kids' snack box"],
    faqs: [],
  },
];

const blogs = [
  {
    slug: "perfect-ragi-dosa", title: "The Perfect Ragi Dosa: A Grandmother's Method", category: "recipes",
    excerpt: "Crisp edges, soft centre, deep nutty flavour — the ragi dosa of our childhood, step by step.",
    cover: media("blog/ragi-dosa-recipe.jpg"), tags: ["ragi", "dosa", "breakfast"],
    content: `<p>In our village, ragi dosa was never a "health food" — it was simply breakfast. Here is the method exactly as our grandmothers made it.</p><h3>Ingredients</h3><ul><li>1 cup Madhura Naturals Ragi Flour</li><li>½ cup rice flour</li><li>¼ cup sour buttermilk</li><li>1 onion, finely chopped; green chillies, curry leaves, cumin</li><li>Cold pressed groundnut oil for the pan</li></ul><h3>Method</h3><ol><li>Whisk the flours with buttermilk and enough water into a thin, pourable batter. Rest 30 minutes.</li><li>Stir in onion, chillies, curry leaves and cumin with a pinch of salt.</li><li>Heat a cast-iron tawa until water droplets dance. Pour from the outside in, lacy and thin.</li><li>Drizzle groundnut oil around the edges. When the underside browns, fold and serve.</li></ol><p>Serve with coconut chutney and a spoon of A2 ghee on top — non-negotiable.</p>`,
  },
  {
    slug: "cold-pressed-vs-refined-oils", title: "Cold Pressed vs Refined: What Your Oil Isn't Telling You", category: "health",
    excerpt: "Refining strips oils of everything that made them food. Here is what actually happens at the factory — and at the ghani.",
    cover: media("blog/cold-pressed-oils.jpg"), tags: ["oils", "cold pressed", "health"],
    content: `<p>Most supermarket oil is extracted with hexane, degummed, bleached and deodorised at temperatures above 200°C. What survives is pure fat — flavourless, colourless and stripped of nutrients.</p><h3>The ghani difference</h3><p>A wooden ghani turns at 15–20 RPM. The temperature never crosses 40°C. Vitamin E, phytosterols, natural antioxidants and the seed's real flavour stay in the bottle.</p><h3>How to spot real cold pressed oil</h3><ul><li>It has aroma — groundnut oil should smell of groundnuts.</li><li>Light sediment at the bottom is normal and good.</li><li>It solidifies or thickens in winter (especially coconut).</li><li>The label says the pressing date, not just "best before".</li></ul><p>Your grandmother never needed a nutrition label to know this. Neither do you.</p>`,
  },
  {
    slug: "natural-farming-journal", title: "A Season With Our Farmers: Natural Farming in Practice", category: "farming",
    excerpt: "No urea, no pesticides, no shortcuts. A photo journal from the rain-fed farms that grow your food.",
    cover: media("blog/traditional-farming.jpg"), tags: ["farming", "organic", "farmers"],
    content: `<p>Every Madhura Naturals grain comes from farms practising natural, rain-fed agriculture — many of them certified organic, all of them chemical-free for at least seven years.</p><h3>What natural farming looks like</h3><ul><li><b>Jeevamrutham</b> instead of urea: a fermented culture of cow dung, jaggery and gram flour feeds the soil biology.</li><li><b>Neem and buttermilk sprays</b> instead of pesticides.</li><li><b>Desi seeds</b>, saved and exchanged between farming families for generations.</li><li><b>Mixed cropping</b> — millets grow alongside pulses, so the land never exhausts.</li></ul><p>We pay our farmer partners 15–20% above market rate and buy their entire chemical-free harvest. When you buy a pouch of ragi, that is where the money goes.</p>`,
  },
  {
    slug: "millets-complete-guide", title: "Millets, Explained: A Complete Guide to the Ancient Grains", category: "tips",
    excerpt: "Jowar, ragi, brown top and friends — what each millet does, and how to actually cook them.",
    cover: media("blog/millet-benefits.jpg"), tags: ["millets", "nutrition", "guide"],
    content: `<p>India grew millets for 5,000 years before rice and wheat took over our plates. Here is a working guide to bringing them back.</p><h3>Know your millets</h3><ul><li><b>Jowar (sorghum)</b> — mild, versatile, the best gateway millet. Rotte, upma, salads.</li><li><b>Ragi (finger millet)</b> — calcium champion; 344mg per 100g. Porridge, mudde, dosa.</li><li><b>Brown top</b> — rare, delicate, gentle on digestion; one of the five "positive millets".</li></ul><h3>Three rules for cooking millets</h3><ol><li>Soak. At least 4 hours; overnight for whole millets.</li><li>Rest cooked millets 10 minutes, covered, before serving.</li><li>Start with one millet meal a day — your gut needs time to adjust to the fibre.</li></ol><p>Small grains, big change.</p>`,
  },
];

const faqs = [
  { question: "Are your products certified organic?", answer: "Our farms are certified under India Organic / NPOP standards, and every batch is traceable to its farmer group. Certification numbers are printed on each pack.", category: "products", sortOrder: 1 },
  { question: "How fresh are the oils and flours?", answer: "We press oils and mill flours in small weekly batches. Every pack carries its pressing or milling date — most reach you within 2–3 weeks of production.", category: "products", sortOrder: 2 },
  { question: "Where do you deliver and how long does it take?", answer: "We ship across India. Metro cities typically receive orders in 2–4 days and other regions in 4–7 days. Shipping is free on orders above ₹999 in most zones.", category: "shipping", sortOrder: 3 },
  { question: "What is your return policy?", answer: "Unopened products can be returned within 7 days of delivery for a full refund. For any quality concern, send us a photo and we will replace the product immediately — no questions asked.", category: "returns", sortOrder: 4 },
  { question: "Why does cold pressed oil have sediment?", answer: "Because it is unrefined. Natural particles from the seed settle at the bottom — a sign of purity, not a defect. You can use the sediment in cooking or let it settle.", category: "products", sortOrder: 5 },
  { question: "Is your ghee really A2?", answer: "Yes — our ghee is churned from the curd of Gir and Sahiwal cows (indigenous A2 breeds), using the traditional bilona method. Lab reports available on request.", category: "products", sortOrder: 6 },
  { question: "Do you use plastic packaging?", answer: "Oils and ghee come in glass; grains and flours in food-grade kraft pouches. Outer packaging is recycled cardboard with paper tape.", category: "general", sortOrder: 7 },
  { question: "Can I pay cash on delivery?", answer: "Online payment options are available at checkout. COD is being rolled out for select pincodes — the checkout will show it automatically if your pincode qualifies.", category: "orders", sortOrder: 8 },
];

const testimonials = [
  { name: "Lakshmi Iyer", location: "Chennai", quote: "The sesame oil smells exactly like the one my mother used to get from our village ghani. I have finally stopped searching.", rating: 5 },
  { name: "Rohan Deshpande", location: "Pune", quote: "Their A2 ghee is worth every rupee. Grainy, aromatic and honest — you can taste the bilona difference.", rating: 5 },
  { name: "Ananya Reddy", location: "Hyderabad", quote: "My kids now ask for ragi dosa over regular dosa. The flour is so fresh it smells sweet when you open the pack.", rating: 5 },
  { name: "Vikram Nair", location: "Bengaluru", quote: "Ordered turmeric and jaggery first, now half my kitchen is Madhura Naturals. Packaging is beautiful enough to gift.", rating: 5 },
  { name: "Meera Krishnan", location: "Coimbatore", quote: "The millet biscuits are dangerous — the box never survives the week. Love that there is no maida.", rating: 4 },
  { name: "Sunita Rao", location: "Visakhapatnam", quote: "Genuine cold pressed oils, quick delivery, and they answer the phone when you call. Old-school service.", rating: 5 },
];

const zones = [
  { name: "Hyderabad & Telangana", pincodePrefixes: ["50"], fee: 4900, freeAbove: 79900, etaDaysMin: 1, etaDaysMax: 3 },
  { name: "South India", pincodePrefixes: ["5", "6"], fee: 6900, freeAbove: 99900, etaDaysMin: 2, etaDaysMax: 5 },
  { name: "Rest of India", pincodePrefixes: [], fee: 9900, freeAbove: 99900, etaDaysMin: 4, etaDaysMax: 7 },
];

async function main() {
  console.log("Seeding Madhura Naturals…");

  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: c });
  }
  const catMap = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  for (const p of products) {
    const { category, faqs: pFaqs, nutrition, ...rest } = p;
    const data = {
      ...rest,
      sku: `MN-${p.slug.toUpperCase().replace(/-/g, "").slice(0, 12)}`,
      categoryId: catMap[category],
      images: [media(`products/${p.slug}.jpg`)],
      stock: p.stock ?? 60,
      nutrition: Object.keys(nutrition).length ? nutrition : undefined,
      faqs: pFaqs.length ? pFaqs : undefined,
      seoTitle: `${p.name} | Madhura Naturals`,
      seoDescription: p.tagline,
    };
    await prisma.product.upsert({ where: { slug: p.slug }, create: data, update: data });
  }

  for (const b of blogs) {
    await prisma.blogPost.upsert({ where: { slug: b.slug }, create: b, update: b });
  }

  await prisma.faq.deleteMany();
  await prisma.faq.createMany({ data: faqs });
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({ data: testimonials });
  await prisma.shippingZone.deleteMany();
  await prisma.shippingZone.createMany({ data: zones });

  const couponData = [
    { code: "WELCOME10", description: "10% off your first order", type: "PERCENT" as const, value: 10, minCart: 49900, maxDiscount: 20000, perUserLimit: 1 },
    { code: "MILLETLOVE", description: "15% off all millets", type: "PERCENT" as const, value: 15, minCart: 0, maxDiscount: 30000, categoryId: catMap["millets"], perUserLimit: 3 },
    { code: "FREESHIP", description: "Flat ₹99 off — covers shipping", type: "FLAT" as const, value: 9900, minCart: 149900, autoApply: true, perUserLimit: 5 },
  ];
  for (const c of couponData) {
    await prisma.coupon.upsert({ where: { code: c.code }, create: c, update: c });
  }

  const adminEmail = "admin@madhuranaturals.in";
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Madhura Admin",
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "Madhura@2026", 11),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
    update: { role: "ADMIN" },
  });

  await prisma.setting.upsert({
    where: { key: "store" },
    create: {
      key: "store",
      value: {
        phone: "+91 98765 43210",
        email: "care@madhuranaturals.in",
        address: "Madhura Naturals, Plot 12, Organic Farmers Colony, Zaheerabad, Telangana 502220",
        hours: "Mon–Sat, 9:00 AM – 6:00 PM IST",
        instagram: "https://instagram.com/madhuranaturals",
        facebook: "https://facebook.com/madhuranaturals",
        youtube: "https://youtube.com/@madhuranaturals",
      },
    },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
