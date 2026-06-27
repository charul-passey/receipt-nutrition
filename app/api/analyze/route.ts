import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type GroceryItem = {
  name: string;
  quantity: string;
};

type NutritionData = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

type AnalyzedItem = {
  name: string;
  quantity: string;
  nutrition: NutritionData;
};

type AnalysisResult = {
  items: AnalyzedItem[];
  totals: NutritionData;
};

const NUTRIENT_MAP: Record<string, keyof NutritionData> = {
  Energy: "calories",
  Protein: "protein",
  "Total lipid (fat)": "fat",
  "Carbohydrate, by difference": "carbs",
  "Fiber, total dietary": "fiber",
  "Sugars, total including NLEA": "sugar",
  Sodium: "sodium",
};

function emptyNutrition(): NutritionData {
  return {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };
}

async function fetchNutrition(itemName: string): Promise<NutritionData> {
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(itemName)}&pageSize=1&api_key=DEMO_KEY`;
    const res = await fetch(url);
    if (!res.ok) return emptyNutrition();

    const data = await res.json();
    const food = data?.foods?.[0];
    if (!food) return emptyNutrition();

    const nutrition = emptyNutrition();
    for (const nutrient of food.foodNutrients ?? []) {
      const key = NUTRIENT_MAP[nutrient.nutrientName];
      if (key) {
        nutrition[key] = Math.round((nutrient.value ?? 0) * 10) / 10;
      }
    }
    return nutrition;
  } catch {
    return emptyNutrition();
  }
}

function addNutrition(a: NutritionData, b: NutritionData): NutritionData {
  return {
    calories: Math.round((a.calories + b.calories) * 10) / 10,
    protein: Math.round((a.protein + b.protein) * 10) / 10,
    fat: Math.round((a.fat + b.fat) * 10) / 10,
    carbs: Math.round((a.carbs + b.carbs) * 10) / 10,
    fiber: Math.round((a.fiber + b.fiber) * 10) / 10,
    sugar: Math.round((a.sugar + b.sugar) * 10) / 10,
    sodium: Math.round((a.sodium + b.sodium) * 10) / 10,
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { image, mediaType } = await request.json();

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType ?? "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: 'This is a grocery receipt. Extract all grocery food items from it. Return ONLY a valid JSON array with no markdown, no explanation, no code block. Format: [{"name": "item name", "quantity": "quantity if visible or empty string"}]. Include only actual food/grocery products, not store fees, taxes, or non-food items.',
            },
          ],
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    let groceryItems: GroceryItem[] = [];
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      groceryItems = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      groceryItems = [];
    }

    if (groceryItems.length === 0) {
      return Response.json(
        { error: "No grocery items found in the receipt" },
        { status: 422 }
      );
    }

    const analyzedItems: AnalyzedItem[] = await Promise.all(
      groceryItems.map(async (item) => {
        const nutrition = await fetchNutrition(item.name);
        return { name: item.name, quantity: item.quantity, nutrition };
      })
    );

    const totals = analyzedItems.reduce(
      (acc, item) => addNutrition(acc, item.nutrition),
      emptyNutrition()
    );

    const result: AnalysisResult = { items: analyzedItems, totals };
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
