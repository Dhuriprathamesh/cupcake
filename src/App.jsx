import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes'; // Ensure this matches where your router index is exported
import { SpaceProvider } from './context/SpaceContext';

export default function App() {
  return (
    <SpaceProvider>
      <RouterProvider router={router} />
    </SpaceProvider>
  );
}