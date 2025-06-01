type Props = {
  title: string;
  href: string;
};

export default function DefaultPageTile({ title, href }: Props) {
  return (
    <a
      href={href}
      className="card bg-base-100 shadow-xl p-6 hover:bg-base-200 transition"
    >
      <h2 className="text-2xl font-bold">{title}</h2>
    </a>
  );
}
