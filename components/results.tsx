"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

function MacroBar({
  label,
  grams,
  calories,
  totalCalories,
  color,
}: {
  label: string;
  grams: number;
  calories: number;
  totalCalories: number;
  color: string;
}) {
  const pct =
    totalCalories > 0 ? Math.round((calories / totalCalories) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-sm text-gray-600 shrink-0">{label}</div>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-sm font-medium w-16 text-right shrink-0">
        {grams}g ({pct}%)
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-5 text-center">
        <div className="text-3xl font-bold text-gray-900">
          {value}
          <span className="text-base font-normal text-gray-500 ml-1">
            {unit}
          </span>
        </div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

export function Results({ data }: { data: AnalysisResult }) {
  const { items, totals } = data;

  const proteinCals = totals.protein * 4;
  const fatCals = totals.fat * 9;
  const carbCals = totals.carbs * 4;

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Nutrition Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="Total Calories" value={totals.calories} unit="kcal" />
          <SummaryCard label="Total Protein" value={totals.protein} unit="g" />
          <SummaryCard label="Total Carbs" value={totals.carbs} unit="g" />
          <SummaryCard label="Total Fat" value={totals.fat} unit="g" />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Macro Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MacroBar
            label="Protein"
            grams={totals.protein}
            calories={proteinCals}
            totalCalories={totals.calories}
            color="bg-blue-400"
          />
          <MacroBar
            label="Carbs"
            grams={totals.carbs}
            calories={carbCals}
            totalCalories={totals.calories}
            color="bg-amber-400"
          />
          <MacroBar
            label="Fat"
            grams={totals.fat}
            calories={fatCals}
            totalCalories={totals.calories}
            color="bg-rose-400"
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Items ({items.length})
        </h2>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.name}
                    </span>
                    {item.quantity && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.quantity}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {item.nutrition.calories} kcal
                  </span>
                </div>
                <Separator className="mb-3" />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  {[
                    { label: "Protein", value: item.nutrition.protein, unit: "g" },
                    { label: "Fat", value: item.nutrition.fat, unit: "g" },
                    { label: "Carbs", value: item.nutrition.carbs, unit: "g" },
                    { label: "Fiber", value: item.nutrition.fiber, unit: "g" },
                    { label: "Sugar", value: item.nutrition.sugar, unit: "g" },
                    { label: "Sodium", value: item.nutrition.sodium, unit: "mg" },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="text-sm font-medium text-gray-800">
                        {value}
                        {unit}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
