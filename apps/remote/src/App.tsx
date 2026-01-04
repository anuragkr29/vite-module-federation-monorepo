import { useState } from "react";
import { getGreeting, APP_NAME } from "@mfe/shared";

function App() {
  const [count, setCount] = useState(0);
  const greeting = getGreeting();

  return (
    <div className="tw-min-h-screen tw-bg-gradient-to-br tw-from-purple-500 tw-to-pink-500 tw-p-8">
      <div className="tw-max-w-4xl tw-mx-auto">
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-p-8">
          <h1 className="tw-text-4xl tw-font-bold tw-text-purple-600 tw-mb-4">
            🎨 Remote Microfrontend
          </h1>
          <p className="tw-text-xl tw-text-gray-700 tw-mb-6">
            {greeting}! Welcome to the Remote App
          </p>
          <div className="tw-bg-purple-100 tw-rounded-xl tw-p-6 tw-mb-6">
            <p className="tw-text-gray-800 tw-mb-2">
              <span className="tw-font-semibold">Styling:</span> Tailwind CSS with{" "}
              <code className="tw-bg-purple-200 tw-px-2 tw-py-1 tw-rounded">tw-</code> prefix
            </p>
            <p className="tw-text-gray-800 tw-mb-2">
              <span className="tw-font-semibold">Framework:</span> React 19
            </p>
            <p className="tw-text-gray-800">
              <span className="tw-font-semibold">Build:</span> Vite + Module Federation
            </p>
          </div>
          <div className="tw-bg-gradient-to-r tw-from-pink-500 tw-to-purple-500 tw-rounded-xl tw-p-6 tw-text-white">
            <h2 className="tw-text-2xl tw-font-bold tw-mb-4">Interactive Counter</h2>
            <div className="tw-flex tw-items-center tw-gap-4">
              <button
                onClick={() => setCount(count - 1)}
                className="tw-bg-white tw-text-purple-600 tw-font-bold tw-py-3 tw-px-6 tw-rounded-lg tw-shadow-lg hover:tw-bg-purple-50 tw-transition-colors"
              >
                -
              </button>
              <div className="tw-text-5xl tw-font-bold tw-min-w-[100px] tw-text-center">
                {count}
              </div>
              <button
                onClick={() => setCount(count + 1)}
                className="tw-bg-white tw-text-purple-600 tw-font-bold tw-py-3 tw-px-6 tw-rounded-lg tw-shadow-lg hover:tw-bg-purple-50 tw-transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={() => setCount(0)}
              className="tw-mt-4 tw-bg-white tw-text-purple-600 tw-font-semibold tw-py-2 tw-px-4 tw-rounded-lg tw-shadow-md hover:tw-bg-purple-50 tw-transition-colors"
            >
              Reset
            </button>
          </div>
          <div className="tw-mt-6 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
            <p className="tw-text-sm tw-text-blue-800">
              💡 <span className="tw-font-semibold">Shared Library:</span> Using{" "}
              <code className="tw-bg-blue-100 tw-px-1 tw-rounded">{APP_NAME}</code> from @mfe/shared
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
