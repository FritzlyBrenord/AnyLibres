'use client';

export default function PublicHomePage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-4">Bienvenue sur AnyLibre</h1>
      <p className="text-xl text-gray-600 mb-8">
        Découvrez des services de qualité proposés par des professionnels
      </p>
      <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
        Parcourir les services
      </button>
    </div>
  );
}
