import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  Provider as URQLProvider,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
  Client,
} from "urql";
import { createClient as createWSClient } from "graphql-ws";
import Claim from "./routes/claim";
import Staking from "./routes/staking";
import NotFound from "./routes/not-found";
import "./index.css";
import { Toaster } from "react-hot-toast";
import ApiProvider from "./providers/api";
import Layout from "./components/Layout";
import Modals from "./modals";
import Overview from "./routes/overview";
import { BalanceProvider } from "./providers/balance";

const wsClient = createWSClient({
  url: "wss://invarch.squids.live/ocif-squid-invarch/graphql",
  // url: "ws://localhost:4350/graphql",
});

const client = new Client({
  url: "https://invarch.squids.live/ocif-squid-invarch/graphql",
  // url: "http://localhost:4350/graphql",
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(request) {
        const input = { ...request, query: request.query || "" };
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink);
            return { unsubscribe };
          },
        };
      },
    }),
  ],
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
  <>
    <Toaster position="bottom-right" toastOptions={{ className: 'bg-invarchOffBlack bg-opacity-70 text-invarchCream border border-invarchCream border-opacity-20 shadow-sm' }} />
    <BrowserRouter>
      <ApiProvider>
        <BalanceProvider>
          <URQLProvider value={client}>
            <Modals />

            <Routes>
              <Route index element={<Navigate to="overview" replace={true} />} />

              <Route path="/" element={<Layout />}>
                <Route path="overview" element={<Overview />} />

                <Route path="claim" element={<Claim />} />

                {/* Disabled temporarily */}
                {/* <Route path="transfer" element={<Transfer />} /> */}

                <Route path="staking" element={<Staking />} />

                <Route path="404" element={<NotFound />} />

                <Route path="*" element={<Navigate to="/404" replace={true} />} />
              </Route>
            </Routes>
          </URQLProvider>
        </BalanceProvider>
      </ApiProvider>
    </BrowserRouter>
  </>
  // </React.StrictMode>
);
