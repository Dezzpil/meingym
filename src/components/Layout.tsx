"use client";

import React, { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PackageJson from "../../package.json";

type Props = {
  children: ReactNode;
};
export function Layout({ children }: Props) {
  const session = useSession();

  return (
    <div className="container-fluid">
      <nav className="navbar navbar-expand-lg bg-body-tertiary mb-3">
        <div className="container-fluid gap-2 d-flex justify-content-between align-items-baseline">
          <div>
            <a className="navbar-brand" href="/">
              💪 Ты в зале
            </a>
            <a
              className="navbar-brand"
              href="https://github.com/Dezzpil/meingym/blob/main/CHANGELOG.md"
              target="_blank"
            >
              <span className="badge text-bg-primary">
                {PackageJson.version}
              </span>
            </a>
            {session.status === "authenticated" ? (
              <Link href={"/profile"}>{session.data?.user?.name}</Link>
            ) : (
              ""
            )}
          </div>

          <ul className="list-inline d-inline-flex flex-wrap column-gap-3 row-gap-1 mb-0">
            <li className="list-inline-item">
              <Link href={`/trainings`} className="">
                Тренировки
              </Link>
            </li>
            <li className="list-inline-item">
              <Link href={"/rigs"} className="">
                Оборудование
              </Link>
            </li>
            <li className="list-inline-item">
              <Link href={`/actions`} className="">
                Упражнения
              </Link>
            </li>
            <li className="list-inline-item">
              <Link href={`/musclesgroups`} className="">
                Группы
              </Link>
            </li>
            <li className="list-inline-item">
              <Link href={`/muscles`} className="">
                Мышцы
              </Link>
            </li>
          </ul>
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
