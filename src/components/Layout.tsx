"use client";

import React, { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
type Props = {
  children: ReactNode;
};
export function Layout({ children }: Props) {
  const session = useSession();

  return (
    <div className="container-fluid">
      <nav className="navbar navbar-expand-lg bg-body-tertiary mb-3">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            💪 Ты в зале
          </a>

          {session.status === "authenticated" ? (
            <Link href={"/api/auth/signout"}>
              👤 {session.data?.user?.name}
            </Link>
          ) : (
            ""
          )}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {/*<li className="nav-item">*/}
              {/*  <a className="nav-link" href="#">*/}
              {/*    Link*/}
              {/*  </a>*/}
              {/*</li>*/}
            </ul>
          </div>
        </div>
      </nav>
      {session.status === "loading" && (
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      {session.status === "authenticated" && children}
      {session.status === "unauthenticated" && (
        <p>
          Необходимо <Link href={"/api/auth/signin"}>войти в систему</Link>
        </p>
      )}
    </div>
  );
}
