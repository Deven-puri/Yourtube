import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex-1 p-3 sm:p-4 lg:p-6">
      <CategoryTabs />
      <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading videos...</div>}>
        <Videogrid />
      </Suspense>
    </main>
  );
}
