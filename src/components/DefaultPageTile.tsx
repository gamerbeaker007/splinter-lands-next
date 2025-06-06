"use client";

import Link from "next/link";

type Props = {
  title: string;
  href: string;
  image: string;
};

export default function DefaultPageTile({ title, href, image }: Props) {
  console.log(title);
  console.log(href);
  console.log(image);

  return (
    <Link
      href={href}
      className="relative card bg-base-100 shadow-xl p-6 hover:bg-base-200 transition overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <h2 className="relative z-10 text-2xl font-bold">{title}</h2>
    </Link>
  );
}
