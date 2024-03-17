import React from "react";

const Invalid = () => {
  return (
    <main class="grid min-h-screen place-items-center bg-slate-900 py-24 px-6 sm:py-32 lg:px-8">
      <div class="text-center">
        <p class="text-base font-semibold text-sky-600">404</p>
        <h1 class="mt-4 text-3xl font-bold tracking-tight text-sky-200 sm:text-5xl">
          Page not found
        </h1>
        <p class="mt-6 text-base leading-7 text-gray-600">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div class="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/"
            class="rounded-md bg-sky-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            Go back home
          </a>
          <a href="#" class="text-sm font-semibold text-sky-200">
            Contact support <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  );
};

export default Invalid;
