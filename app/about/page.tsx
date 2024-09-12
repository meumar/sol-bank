import { ABOUT_DETAILS, DESCRIPTION } from "@/constants";

export default function About() {
  return (
    <section className="mt-10 bg-slate-800 py-10 shadow-lg rounded-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-medium text-gray-100">
            About Sol-Bank
          </h2>
          <p className="mt-4 text-lg text-gray-100">{DESCRIPTION}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {ABOUT_DETAILS.map((card) => (
            <div className="p-6 bg-slate-900 shadow-lg rounded-lg hover:shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-200">
                {card.title}
              </h3>
              <p className="mt-4 text-gray-400">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
