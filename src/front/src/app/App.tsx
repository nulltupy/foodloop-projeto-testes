import { Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <div className="min-h-screen bg-surface-50 text-ink-900">
      <Routes>
        <Route
          path="/"
          element={
            <main className="p-8">
              <h1 className="text-2xl font-semibold text-brand-700">FoodLoop</h1>
              <p className="mt-2 text-ink-500">Front em construção.</p>
            </main>
          }
        />
      </Routes>
    </div>
  );
}
