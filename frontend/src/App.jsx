/**
 * App — Root component with routing.
 *
 * Routes:
 *   /                  → Dashboard
 *   /machine/:machineId → Investigation View
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InvestigationView from './components/InvestigationView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/machine/:machineId" element={<InvestigationView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
