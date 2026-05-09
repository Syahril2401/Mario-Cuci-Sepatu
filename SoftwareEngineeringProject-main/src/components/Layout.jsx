import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Drawer from './Drawer';

const Layout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <>
      <Header toggleDrawer={toggleDrawer} />
      <Drawer isOpen={isDrawerOpen} toggleDrawer={toggleDrawer} />
      <main className="app-content" style={{ padding: 0 }}>
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
