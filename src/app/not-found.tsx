"use client";

import { siteConfig } from "@/config/site";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    document.title = `404 Not Found | ${siteConfig.name}`;
  }, []);

  return (
    <div className="absolute-center text-center">
      <h1>404</h1>
      <h4>Not Found</h4>
      <p>The page you are looking for doesn't exist.</p>
      <Button as={Link} href="/" className="mt-8">
        Home
      </Button>
    </div>
  );
}
