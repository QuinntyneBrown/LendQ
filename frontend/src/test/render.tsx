import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";

interface RenderWithRouterOptions {
  route?: string;
  path?: string;
}

export function renderWithRouter(
  ui: ReactElement,
  {
    route = "/",
    path = "*",
  }: RenderWithRouterOptions = {},
) {
  return render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}
