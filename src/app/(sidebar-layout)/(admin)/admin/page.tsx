"use client";

import React from "react";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

const DashboardPage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <Button onClick={() => signOut()}>sigOut</Button>
    </div>
  );
};
export default DashboardPage;
